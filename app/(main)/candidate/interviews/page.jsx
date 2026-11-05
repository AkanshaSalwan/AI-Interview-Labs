'use client'
import { useState } from 'react'
import { CalendarDays, Search, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAssignedInterviews } from '../_components/useAssignedInterviews'
import ApplicationCard from '../_components/ApplicationCard'

// Where an assigned interview stands, from the candidate's point of view.
function statusOf(invite) {
    if (invite.status !== 'completed') return 'todo'
    return { shortlisted: 'shortlisted', hired: 'selected', rejected: 'not-selected' }[invite.decision] ?? 'review'
}

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'todo', label: 'To do' },
    { id: 'review', label: 'Under review' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'selected', label: 'Selected' },
    { id: 'not-selected', label: 'Not selected' },
]

function Header() {
    return (
        <div className='mb-6'>
            <h1 className='text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]'>My Interviews</h1>
            <p className='mt-1.5 text-[15px] text-slate-500'>Interviews HR has assigned to you, and where each one stands.</p>
        </div>
    )
}

function InterviewsPage() {
    const { assigned, loading } = useAssignedInterviews()
    const [filter, setFilter] = useState('all')
    const [query, setQuery] = useState('')

    if (loading) {
        return (
            <div>
                <Header />
                <div className='space-y-3'>
                    {[0, 1, 2].map((item) => <div key={item} className='surface h-[72px] animate-pulse rounded-2xl' />)}
                </div>
            </div>
        )
    }

    const counts = Object.fromEntries(FILTERS.map((item) => [
        item.id,
        item.id === 'all' ? assigned.length : assigned.filter((invite) => statusOf(invite) === item.id).length,
    ]))
    const search = query.trim().toLowerCase()
    const visible = assigned.filter((invite) =>
        (filter === 'all' || statusOf(invite) === filter)
        && (!search || String(invite.interview?.jobPosition ?? '').toLowerCase().includes(search))
    )
    // "All" keeps interviews still to take on top; other filters are a single list.
    const sections = filter === 'all'
        ? [
            { title: 'Waiting for you', rows: visible.filter((invite) => statusOf(invite) === 'todo') },
            { title: 'Submitted', rows: visible.filter((invite) => statusOf(invite) !== 'todo') },
        ].filter((section) => section.rows.length)
        : [{ title: null, rows: visible }]

    return (
        <div>
            <Header />

            {!assigned.length ? (
                <div className='surface flex flex-col items-center rounded-2xl px-6 py-14 text-center'>
                    <span className='flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
                        <CalendarDays className='size-6' strokeWidth={1.75} />
                    </span>
                    <h3 className='mt-4 text-[15px] font-medium text-slate-900'>No invitations yet</h3>
                    <p className='mt-1 max-w-sm text-sm text-slate-500'>
                        When HR assigns an interview to this email address, it appears here.
                    </p>
                </div>
            ) : (
                <>
                    <div className='mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                        <div className='flex flex-wrap gap-1.5' role='tablist' aria-label='Filter interviews'>
                            {FILTERS.map((item) => (
                                <button
                                    key={item.id}
                                    type='button'
                                    role='tab'
                                    aria-selected={filter === item.id}
                                    onClick={() => setFilter(item.id)}
                                    className={cn(
                                        'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors',
                                        filter === item.id
                                            ? 'border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                                            : counts[item.id]
                                                ? 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/60'
                                                : 'border-slate-200/70 bg-white/60 text-slate-400 hover:text-slate-600'
                                    )}
                                >
                                    {item.label}
                                    <span className={cn('tabular-nums text-xs', filter === item.id ? 'text-orange-100' : 'text-slate-400')}>{counts[item.id]}</span>
                                </button>
                            ))}
                        </div>
                        <label className='relative w-full lg:max-w-60'>
                            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder='Search by role'
                                className='field h-9 pl-9'
                            />
                        </label>
                    </div>

                    {!visible.length ? (
                        <div className='surface flex flex-col items-center rounded-2xl px-6 py-12 text-center'>
                            <SearchX className='size-5 text-slate-400' />
                            <p className='mt-2 text-sm font-medium text-slate-700'>No interviews here</p>
                            <p className='mt-0.5 text-[13px] text-slate-500'>Try another filter{search ? ' or clear the search' : ''}.</p>
                        </div>
                    ) : (
                        <div className='space-y-8'>
                            {sections.map((section) => (
                                <section key={section.title ?? filter}>
                                    {section.title && (
                                        <h2 className='mb-3 flex items-center gap-2 text-[13px] font-medium text-slate-500'>
                                            {section.title}
                                            <span className='rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600'>{section.rows.length}</span>
                                        </h2>
                                    )}
                                    <ul className='space-y-3'>
                                        {section.rows.map((invite) => <ApplicationCard key={invite.id} invite={invite} />)}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default InterviewsPage
