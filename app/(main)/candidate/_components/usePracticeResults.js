'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { overallScore } from '@/services/scores'

// The signed-in candidate's practice sessions (newest first), each with
// jobPosition, difficulty and an overall score. Recruiter interviews are excluded:
// those scores belong to the recruiter.
export function usePracticeResults() {
    const supabase = useMemo(() => createClient(), [])
    const { user } = useUser()
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.email) return

        const load = async () => {
            setLoading(true)
            const { data: feedbackRows, error } = await supabase
                .from('interview feedback')
                .select('*')
                .ilike('userEmail', user.email)
                .order('id', { ascending: false })

            if (error) {
                console.error('Unable to load your practice results:', { message: error.message, code: error.code })
                setResults([])
                setLoading(false)
                return
            }

            const interviewIds = [...new Set((feedbackRows || []).map((row) => row.interview_id).filter(Boolean))]
            let practiceInterviews = {}
            if (interviewIds.length) {
                const { data: interviews } = await supabase
                    .from('interviews')
                    .select('interview_id, jobPosition, difficulty, is_practice')
                    .in('interview_id', interviewIds)
                    .eq('is_practice', true)
                practiceInterviews = Object.fromEntries((interviews || []).map((item) => [item.interview_id, item]))
            }

            setResults((feedbackRows || [])
                .filter((row) => row.interview_id in practiceInterviews)
                .map((row) => ({
                    ...row,
                    jobPosition: practiceInterviews[row.interview_id]?.jobPosition ?? 'Interview',
                    difficulty: practiceInterviews[row.interview_id]?.difficulty ?? null,
                    score: overallScore(row),
                })))
            setLoading(false)
        }

        load()
    }, [supabase, user?.email])

    return { results, loading }
}
