'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Gauge, UsersRound, Video } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { averageScore, isRecommended } from '@/services/scores'
import StatCard from '../../_components/StatCard'

function RecruiterStats() {
    const supabase = useMemo(() => createClient(), [])
    const { user } = useUser()
    const [stats, setStats] = useState(null)

    useEffect(() => {
        if (!user?.email) return

        const loadStats = async () => {
            const { data: interviews, error } = await supabase
                .from('interviews')
                .select('interview_id')
                .eq('userEmail', user.email)

            if (error) {
                console.error('Unable to load interview stats:', error)
                setStats({ interviews: 0, feedback: [] })
                return
            }

            const ids = (interviews || []).map((item) => item.interview_id).filter(Boolean)
            let feedback = []
            if (ids.length) {
                const { data, error: feedbackError } = await supabase
                    .from('interview feedback')
                    .select('feedback, recommended')
                    .in('interview_id', ids)
                if (feedbackError) console.error('Unable to load candidate stats:', feedbackError)
                feedback = data || []
            }

            setStats({ interviews: ids.length, feedback })
        }

        loadStats()
    }, [supabase, user?.email])

    const loading = !stats
    const average = stats ? averageScore(stats.feedback) : null

    return (
        <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard icon={Video} label='Interviews created' value={stats?.interviews ?? 0} loading={loading} />
            <StatCard icon={UsersRound} label='Candidates interviewed' value={stats?.feedback.length ?? 0} tone='sky' loading={loading} />
            <StatCard
                icon={BadgeCheck}
                label='Recommended'
                value={stats?.feedback.filter(isRecommended).length ?? 0}
                tone='emerald'
                loading={loading}
            />
            <StatCard icon={Gauge} label='Average score' value={average !== null ? `${average}/10` : '—'} tone='amber' loading={loading} />
        </div>
    )
}

export default RecruiterStats
