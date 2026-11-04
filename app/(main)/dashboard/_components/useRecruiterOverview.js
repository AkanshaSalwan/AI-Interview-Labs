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
                    supabase.from('interview feedback').select('id, interview_id, userName, userEmail, feedback, recommended, recruiter_status, created_at').in('interview_id', ids).order('id', { ascending: false }),
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

    // Shortlist / hire / reject a report. Shows the change at once and puts the old value back if the save fails.
    const setDecision = useCallback(async (reportId, recruiter_status) => {
        const applyStatus = (status) => setOverview((current) => current && {
            ...current,
            reports: current.reports.map((report) => (report.id === reportId ? { ...report, recruiter_status: status } : report)),
        })
        const previous = overview?.reports.find((report) => report.id === reportId)?.recruiter_status ?? 'pending'

        applyStatus(recruiter_status)
        const { error } = await supabase.from('interview feedback').update({ recruiter_status }).eq('id', reportId)
        if (error) {
            applyStatus(previous)
            toast.add({
                title: 'Could not save the decision',
                // 23514 = check constraint: the "hired" stage needs migration 009.
                description: error.code === '23514' ? 'Run supabase/migrations/009_hired_status.sql in Supabase first.' : error.message,
            })
            return false
        }
        return true
    }, [supabase, overview])

    return {
        supabase,
        user,
        loading: !overview,
        interviews: overview?.interviews ?? [],
        invites: overview?.invites ?? [],
        reports: overview?.reports ?? [],
        addInvite,
        setDecision,
    }
}
