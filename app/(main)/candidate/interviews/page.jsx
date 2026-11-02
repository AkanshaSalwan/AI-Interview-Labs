'use client'
import { CalendarDays } from 'lucide-react'
import { useAssignedInterviews } from '../_components/useAssignedInterviews'
import AssignedInterviewItem from '../_components/AssignedInterviewItem'

function Header() {
    return (
        <div className='mb-8'>
            <h1 className='text-l font-semibold tracking-tight text-slate-900 sm:text-[28px]'>My Interviews</h1>
            <p className='mt-1.5 text-[15px] text-slate-500'>Interviews recruiters have invited you to.</p>
        </div>
    )
}

function InterviewsPage() {
    const { assigned, loading } = useAssignedInterviews()
    const pending = assigned.filter((invite) => invite.status !== 'completed')
    const completed = assigned.filter((invite) => invite.status === 'completed')

    if (loading) {
        return (
            <div>
                <Header />
                <div className='space-y-3'>
                    {[0, 1, 2].map((item) => <div key={item} className='card-soft h-[72px] animate-pulse rounded-2xl' />)}
                </div>
            </div>
        )
    }

    return (
        <div>
            <Header />

            {!assigned.length ? (
                <div className='card-soft flex flex-col items-center rounded-2xl px-6 py-14 text-center'>
                    <span className='flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
                        <CalendarDays className='size-6' strokeWidth={1.75} />
                    </span>
                    <h3 className='mt-4 text-[15px] font-medium text-slate-900'>No invitations yet</h3>
                    <p className='mt-1 max-w-sm text-sm text-slate-500'>
                        When a recruiter invites this email address to an interview, it will appear here.
                    </p>
                </div>
            ) : (
                <div className='space-y-8'>
                    {[{ title: 'Waiting for you', rows: pending }, { title: 'Submitted', rows: completed }]
                        .filter((section) => section.rows.length)
                        .map((section) => (
                            <section key={section.title}>
                                <h2 className='mb-3 flex items-center gap-2 text-[13px] font-medium text-slate-500'>
                                    {section.title}
                                    <span className='rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600'>{section.rows.length}</span>
                                </h2>
                                <ul className='card-soft divide-y divide-orange-50 overflow-hidden rounded-2xl'>
                                    {section.rows.map((invite) => <AssignedInterviewItem key={invite.id} invite={invite} />)}
                                </ul>
                            </section>
                        ))}
                </div>
            )}
        </div>
    )
}

export default InterviewsPage
