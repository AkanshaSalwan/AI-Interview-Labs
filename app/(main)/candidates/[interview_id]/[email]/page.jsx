'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SearchX } from 'lucide-react'
import { useRecruiterOverview } from '../../../dashboard/_components/useRecruiterOverview'
import EmptyState from '../../../_components/EmptyState'
import CandidateDetails from '../../_components/CandidateDetails'
import { buildCandidates } from '../../_components/pipeline'

// One candidate's details for one interview, opened from "View details" on the Candidates page.
function CandidateDetailsPage() {
    const { interview_id: interviewId, email: rawEmail } = useParams()
    const email = decodeURIComponent(rawEmail ?? '').toLowerCase()
    const { loading, interviews, invites, reports, setDecision, updateReport } = useRecruiterOverview()

    const candidate = useMemo(
        () => buildCandidates(interviews, invites, reports)
            .find((item) => item.interview.interview_id === interviewId && item.email?.toLowerCase() === email),
        [interviews, invites, reports, interviewId, email]
    )

    if (loading) {
        return (
            <div className='mx-auto max-w-4xl space-y-4'>
                <div className='h-5 w-28 animate-pulse rounded bg-orange-50' />
                <div className='h-40 animate-pulse rounded-2xl bg-orange-50/70' />
                <div className='h-72 animate-pulse rounded-2xl bg-orange-50/70' />
            </div>
        )
    }

    if (!candidate) {
        return (
            <EmptyState
                icon={SearchX}
                title='Candidate not found'
                description='They may have been removed from this interview, or it belongs to another recruiter.'
                action={<Link href='/candidates' className='text-sm font-medium text-orange-600 hover:text-orange-700'>Back to candidates</Link>}
            />
        )
    }

    return (
        <CandidateDetails
            candidate={candidate}
            onMove={(item, stage) => setDecision(item.report.id, stage)}
            onUpdateReport={updateReport}
        />
    )
}

export default CandidateDetailsPage
