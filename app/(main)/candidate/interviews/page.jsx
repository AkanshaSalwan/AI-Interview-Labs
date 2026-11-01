'use client'
import { CalendarClock } from 'lucide-react'
import PageHeader from '../../_components/PageHeader'
import EmptyState from '../../_components/EmptyState'
import { useAssignedInterviews } from '../_components/useAssignedInterviews'
import AssignedInterviewItem from '../_components/AssignedInterviewItem'

function InterviewsPage() {
    const { assigned, loading } = useAssignedInterviews()
    const pending = assigned.filter((invite) => invite.status !== 'completed')
    const completed = assigned.filter((invite) => invite.status === 'completed')

    if (loading) {
        return (
            <div>
                <PageHeader title='My Interviews' description='Interviews recruiters have invited you to.' />
                <div className='space-y-3'>
                    {[0, 1, 2].map((item) => <div key={item} className='h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-white' />)}
                </div>
            </div>
        )
    }

    return (
        <div>
            <PageHeader title='My Interviews' description='Interviews recruiters have invited you to.' />

            {!assigned.length ? (
                <EmptyState
                    icon={CalendarClock}
                    title='No invitations yet'
                    description='When a recruiter invites this email address to an interview, it will appear here.'
                />
            ) : (
                <div className='space-y-8'>
                    {[{ title: 'Waiting for you', rows: pending }, { title: 'Submitted', rows: completed }]
                        .filter((section) => section.rows.length)
                        .map((section) => (
                            <section key={section.title}>
                                <h2 className='mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400'>
                                    {section.title} · {section.rows.length}
                                </h2>
                                <ul className='divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white'>
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
