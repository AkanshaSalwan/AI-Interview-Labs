'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { toast } from '@/components/ui/toast'

// Everything the HR dashboard shows: the recruiter's interviews (newest first),
// the candidates they assigned, and the reports candidates submitted.
export function useRecruiterOverview() {
    const supabase = useMemo(() => createClient(), [])
    const { user } = useUser()
    const [overview, setOverview] = useState(null)

    useEffect(() => {
        if (!user?.email) return

        const load = async () => {
            const { data: interviews, error } = await supabase
                .from('interviews')
                .select('*')
                .eq('userEmail', user.email)
                .eq('is_practice', false)
                .order('id', { ascending: false })

            if (error) {
                console.error('Unable to load your interviews:', error)
                setOverview({ interviews: [], invites: [], reports: [] })
                return
            }

            const ids = (interviews || []).map((item) => item.interview_id).filter(Boolean)
            const [invitesResult, reportsResult] = ids.length
                ? await Promise.all([
                    supabase.from('interview_invites').select('*').eq('recruiter_email', user.email).order('created_at', { ascending: false }),
                    supabase.from('interview feedback').select('*').in('interview_id', ids).order('id', { ascending: false }),
                ])
                : [{ data: [] }, { data: [] }]

            if (invitesResult.error) console.error('Unable to load assigned candidates:', invitesResult.error)
            if (reportsResult.error) console.error('Unable to load candidate reports:', reportsResult.error)

            setOverview({ interviews: interviews || [], invites: invitesResult.data || [], reports: reportsResult.data || [] })
        }

        load()
    }, [supabase, user?.email])

    const addInvite = useCallback((invite) => {
        setOverview((current) => current && { ...current, invites: [invite, ...current.invites] })
    }, [])

    // Saves HR's changes to a report (decision, notes, message to the candidate).
    // Shows the change at once and puts the old values back if the save fails.
    const updateReport = useCallback(async (reportId, changes) => {
        const previous = overview?.reports.find((report) => report.id === reportId)
        const apply = (values) => setOverview((current) => current && {
            ...current,
            reports: current.reports.map((report) => (report.id === reportId ? { ...report, ...values } : report)),
        })

        apply(changes)
        const { error } = await supabase.from('interview feedback').update(changes).eq('id', reportId)
        if (error) {
            if (previous) apply(Object.fromEntries(Object.keys(changes).map((key) => [key, previous[key]])))
            // 23514 = check constraint ("hired" needs migration 009); PGRST204/42501 = column missing or not allowed (010).
            const hint = error.code === '23514'
                ? 'Run supabase/migrations/009_hired_status.sql in Supabase first.'
                : ['PGRST204', '42501'].includes(error.code) && 'candidate_message' in changes
                    ? 'Run supabase/migrations/010_deadlines_and_messages.sql in Supabase first.'
                    : error.message
            toast.add({ title: 'Could not save the change', description: hint })
            return false
        }
        return true
    }, [supabase, overview])

    const setDecision = useCallback((reportId, recruiter_status) => updateReport(reportId, { recruiter_status }), [updateReport])

    return {
        supabase,
        user,
        loading: !overview,
        interviews: overview?.interviews ?? [],
        invites: overview?.invites ?? [],
        reports: overview?.reports ?? [],
        addInvite,
        setDecision,
        updateReport,
    }
}
