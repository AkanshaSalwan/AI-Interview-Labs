import Link from 'next/link'
import { Plus, Video } from 'lucide-react'
import InterviewCard from '../dashboard/_components/InterviewCard'
import EmptyState from './EmptyState'

// Shared list UI for the dashboard and the All Interviews page.
function InterviewGrid({ interviews, loading, skeletonCount = 3 }) {
    if (loading) {
        return (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: skeletonCount }, (_, index) => (
                    <div key={index} className='h-[230px] animate-pulse rounded-2xl border border-slate-200 bg-white' />
                ))}
            </div>
        )
    }

    if (!interviews.length) {
        return (
            <EmptyState
                icon={Video}
                title='No interviews created yet'
                description='Create your first AI interview and share the link with candidates.'
                action={
                    <Link
                        href='/dashboard/create-interview'
                        className='inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-md shadow-violet-500/25 hover:opacity-90'
                    >
                        <Plus className='size-4' /> Create New Interview
                    </Link>
                }
            />
        )
    }

    return (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {interviews.map((interview, index) => (
                <InterviewCard interview={interview} key={interview?.interview_id || index} />
            ))}
        </div>
    )
}

export default InterviewGrid
