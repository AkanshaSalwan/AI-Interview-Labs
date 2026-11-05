'use client'
import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BriefcaseBusiness, ChevronDown, Filter, GitCompareArrows, KanbanSquare, List, Search, UserRound, UsersRound } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { useRecruiterOverview } from '../dashboard/_components/useRecruiterOverview'
import EmptyState from '../_components/EmptyState'
import CandidateBoard from './_components/CandidateBoard'
import CandidateTable from './_components/CandidateTable'
import CompareDialog from './_components/CompareDialog'
import { STAGES, buildCandidates, roleKey } from './_components/pipeline'

const MAX_COMPARE = 3

const VIEWS = [
    { id: 'board', label: 'Board', icon: KanbanSquare },
    { id: 'list', label: 'List', icon: List },
]

// A native select with an icon on the left and a chevron on the right.
function FilterSelect({ icon: Icon, value, onChange, children, label }) {
    return (
        <label className='relative w-full sm:w-48'>
            <Icon className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500' />
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className='field h-9 cursor-pointer appearance-none pl-9 pr-8 font-medium text-slate-700'
            >
                {children}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
        </label>
    )
}

// Count tile at the top; clicking it filters the list to that stage.
function StageTile({ label, count, dot, tint, active, onClick }) {
    return (
        <button
            type='button'
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                tint ?? 'bg-white',
                active ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200/60 hover:border-slate-300'
            )}
        >
            {dot
                ? <span className={cn('size-2.5 shrink-0 rounded-full', dot)} />
                : <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600'><UserRound className='size-4' /></span>}
            <span>
                <span className='block text-lg font-semibold leading-tight tabular-nums text-slate-900'>{count}</span>
                <span className='block text-xs text-slate-500'>{label}</span>
            </span>
        </button>
    )
}

function CandidatesPage() {
    const router = useRouter()
    const { loading, interviews, invites, reports, setDecision } = useRecruiterOverview()
    const [query, setQuery] = useState('')
    const [role, setRole] = useState('all')
    const [stageFilter, setStageFilter] = useState('all')
    const [view, setView] = useState('list')
    const [selectedKeys, setSelectedKeys] = useState([])
    const [comparing, setComparing] = useState(false)

    const candidates = useMemo(() => buildCandidates(interviews, invites, reports), [interviews, invites, reports])

    // Role filter: one entry per job title, however it was capitalised.
    const roles = useMemo(() => {
        const byKey = new Map()
        for (const interview of interviews) {
            const key = roleKey(interview.jobPosition)
            if (key && !byKey.has(key)) byKey.set(key, interview.jobPosition.trim())
        }
        return [...byKey.entries()]
    }, [interviews])

    const search = query.trim().toLowerCase()
    // Search and role first: the stage tiles count within them.
    const inScope = candidates.filter((candidate) =>
        (role === 'all' || roleKey(candidate.interview.jobPosition) === role)
        && (!search || `${candidate.name ?? ''} ${candidate.email ?? ''} ${candidate.interview.jobPosition ?? ''}`.toLowerCase().includes(search))
    )
    const stageCounts = Object.fromEntries(STAGES.map((stage) => [stage.id, inScope.filter((candidate) => candidate.stage === stage.id).length]))
    const visible = inScope.filter((candidate) => stageFilter === 'all' || candidate.stage === stageFilter)
    const selected = selectedKeys.map((key) => candidates.find((candidate) => candidate.key === key)).filter(Boolean)

    const toggleSelect = (candidate) => {
        setSelectedKeys((keys) => {
            if (keys.includes(candidate.key)) return keys.filter((key) => key !== candidate.key)
            if (keys.length >= MAX_COMPARE) {
                toast.add({ title: `Compare up to ${MAX_COMPARE} candidates at a time` })
                return keys
            }
            return [...keys, candidate.key]
        })
    }

    const moveCandidate = (candidate, stageId) => setDecision(candidate.report.id, stageId)
    const closeCompare = useCallback(() => setComparing(false), [])
    // "View details" opens the candidate's own page; without an email, fall back to the interview page.
    const openCandidate = (candidate) => router.push(candidate.email
        ? `/candidates/${candidate.interview.interview_id}/${encodeURIComponent(candidate.email.toLowerCase())}`
        : `/scheduled-interviews/${candidate.interview.interview_id}`)

    return (
        <div className='relative'>
            {/* Folded-paper accent in the top-right corner */}
            <div aria-hidden className='paper-lift pointer-events-none absolute -right-8 -top-6 hidden h-28 w-56 md:block'>
                <div className='fold-shard-top right-0 top-0 h-full w-full opacity-80' />
            </div>

            <div className='relative mb-5'>
                <h1 className='text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]'>Candidates</h1>
                <p className='mt-1 text-[15px] text-slate-500'>Manage and track candidates across interview stages.</p>
            </div>

            {loading ? (
                <div className='space-y-3'>
                    <div className='grid grid-cols-3 gap-3 lg:grid-cols-6'>
                        {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className='h-16 animate-pulse rounded-2xl bg-orange-50/60' />)}
                    </div>
                    <div className='h-64 animate-pulse rounded-2xl bg-orange-50/60' />
                </div>
            ) : !candidates.length ? (
                <EmptyState
                    icon={UsersRound}
                    title='No candidates yet'
                    description='Assign an interview from the dashboard. Candidates appear here as soon as you do.'
                />
            ) : (
                <>
                    {/* Filters and view switch */}
                    <div className='mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center'>
                        <label className='relative w-full lg:max-w-xs'>
                            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder='Search by name, email or role…'
                                className='field h-9 pl-9'
                            />
                        </label>
                        <div className='flex flex-col gap-2.5 sm:flex-row'>
                            <FilterSelect icon={BriefcaseBusiness} label='Role' value={role} onChange={setRole}>
                                <option value='all'>All roles</option>
                                {roles.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </FilterSelect>
                            <FilterSelect icon={Filter} label='Stage' value={stageFilter} onChange={setStageFilter}>
                                <option value='all'>All stages</option>
                                {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                            </FilterSelect>
                        </div>
                        <div className='inline-flex shrink-0 self-start rounded-[0.625rem] border border-slate-200 bg-white p-0.5 lg:ml-auto lg:self-auto' role='group' aria-label='View'>
                            {VIEWS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type='button'
                                    aria-pressed={view === id}
                                    onClick={() => setView(id)}
                                    className={cn(
                                        'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
                                        view === id ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-300' : 'text-slate-600 hover:text-slate-900'
                                    )}
                                >
                                    <Icon className='size-4' /> {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stage counts */}
                    <div className='mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                        <StageTile label='Total candidates' count={inScope.length} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
                        {STAGES.map((stage) => (
                            <StageTile
                                key={stage.id}
                                label={stage.label}
                                count={stageCounts[stage.id]}
                                dot={stage.dot}
                                tint={stage.tint}
                                active={stageFilter === stage.id}
                                onClick={() => setStageFilter(stageFilter === stage.id ? 'all' : stage.id)}
                            />
                        ))}
                    </div>

                    {!visible.length ? (
                        <EmptyState icon={Search} title='No candidates match' description='Try another stage, role or search.' />
                    ) : view === 'list' ? (
                        <div className='pb-24'>
                            <CandidateTable candidates={visible} selectedKeys={selectedKeys} onOpen={openCandidate} />
                        </div>
                    ) : (
                        <CandidateBoard candidates={visible} selectedKeys={selectedKeys} onMove={moveCandidate} onToggleSelect={toggleSelect} onOpen={openCandidate} />
                    )}
                </>
            )}

            {/* Compare bar */}
            {selected.length > 0 && (
                <div className='fixed inset-x-0 bottom-5 z-30 flex justify-center px-4'>
                    <div className='flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 py-2 pl-4 pr-2 shadow-xl shadow-orange-950/10 backdrop-blur-xl'>
                        <p className='text-sm text-slate-700'>
                            <span className='font-semibold'>{selected.length}</span> selected
                            {selected.length < 2 && <span className='text-slate-400'> · pick one more</span>}
                        </p>
                        <button
                            type='button'
                            onClick={() => setSelectedKeys([])}
                            className='cursor-pointer rounded-lg px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        >
                            Clear
                        </button>
                        <button
                            type='button'
                            disabled={selected.length < 2}
                            onClick={() => setComparing(true)}
                            className='btn-orange inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[0.625rem] px-4 text-sm font-medium text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            <GitCompareArrows className='size-4' /> Compare
                        </button>
                    </div>
                </div>
            )}

            {comparing && selected.length >= 2 && <CompareDialog candidates={selected} onClose={closeCompare} />}
        </div>
    )
}

export default CandidatesPage
