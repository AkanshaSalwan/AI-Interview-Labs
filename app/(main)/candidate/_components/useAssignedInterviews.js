'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'

// Interviews recruiters have invited the signed-in candidate to, newest first.
export function useAssignedInterviews() {
    const supabase = useMemo(() => createClient(), [])
    const { user } = useUser()
    const [assigned, setAssigned] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.email) return

        const load = async () => {
            setLoading(true)
            const { data: invites, error } = await supabase
                .from('interview_invites')
                .select('*')
                .ilike('candidate_email', user.email)
                .order('created_at', { ascending: false })

            if (error) {
                // PGRST205 = table not found: migration 003_candidate_invites.sql hasn't been run.
                console.error('Unable to load your invitations:', {
                    message: error.message,
                    code: error.code,
                    hint: error.code === 'PGRST205'
                        ? 'Run supabase/migrations/003_candidate_invites.sql in the Supabase SQL Editor.'
                        : error.hint,
                })
                setAssigned([])
                setLoading(false)
                return
            }

            const ids = (invites || []).map((invite) => invite.interview_id)
            let interviews = {}
            if (ids.length) {
                const { data } = await supabase
                    .from('interviews')
                    .select('interview_id, jobPosition, duration, type')
                    .in('interview_id', ids)
                interviews = Object.fromEntries((data || []).map((item) => [item.interview_id, item]))
            }

            setAssigned((invites || []).map((invite) => ({ ...invite, interview: interviews[invite.interview_id] })))
            setLoading(false)
        }

        load()
    }, [supabase, user?.email])

    return { assigned, loading }
}
