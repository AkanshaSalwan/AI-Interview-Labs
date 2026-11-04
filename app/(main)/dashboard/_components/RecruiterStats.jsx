import { Gauge, Hourglass, UsersRound, Video } from 'lucide-react'
import { averageScore } from '@/services/scores'
import StatCard from '../../_components/StatCard'

function RecruiterStats({ interviews, invites, reports, loading }) {
    const average = averageScore(reports)
    const awaitingDecision = reports.filter((report) => (report.recruiter_status ?? 'pending') === 'pending').length
    const candidates = new Set(
        [...invites.map((invite) => invite.candidate_email), ...reports.map((report) => report.userEmail)]
            .filter(Boolean)
            .map((email) => email.toLowerCase())
    )

    return (
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <StatCard icon={Video} label='Interviews' value={interviews.length} loading={loading} />
            <StatCard icon={UsersRound} label='Candidates' value={candidates.size} tone='sky' loading={loading} />
            <StatCard icon={Hourglass} label='Awaiting decision' value={awaitingDecision} tone='amber' loading={loading} />
            <StatCard icon={Gauge} label='Average score' value={average !== null ? `${average}/10` : '—'} tone='emerald' loading={loading} />
        </div>
    )
}

export default RecruiterStats
