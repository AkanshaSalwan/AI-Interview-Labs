'use client'
import { useCallback, useMemo, useState } from 'react'
import { GitCompareArrows, Search, UsersRound } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { useRecruiterOverview } from '../dashboard/_components/useRecruiterOverview'
import PageHeader from '../_components/PageHeader'
import EmptyState from '../_components/EmptyState'
import CandidateCard from './_components/CandidateCard'
import CompareDialog from './_components/CompareDialog'
import { STAGES, buildCandidates, roleKey } from './_components/pipeline'

const MAX_COMPARE = 3

function CandidatesPage() {
    const { loading, interviews, invites, reports, setDecision } = useRecruiterOverview()
    const [query, setQuery] = useState('')
    const [role, setRole] = useState('all')
    const [selectedKeys, setSelectedKeys] = useState([])
    const [comparing, setComparing] = useState(false)
    const [draggingKey, setDraggingKey] = useState(null)
    const [overStage, setOverStage] = useState(null)

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
    const visible = candidates.filter((candidate) =>
        (role === 'all' || roleKey(candidate.interview.jobPosition) === role)
        && (!search || `${candidate.name ?? ''} ${candidate.email ?? ''}`.toLowerCase().includes(search))
    )
    const byStage = Object.fromEntries(STAGES.map((stage) => [
        stage.id,
        visible.filter((candidate) => candidate.stage === stage.id).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    ]))
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

    const onDragStart = (event, candidate) => {
        event.dataTransfer.setData('text/plain', candidate.key)
        event.dataTransfer.effectAllowed = 'move'
        setDraggingKey(candidate.key)
    }

    const onDrop = (event, stageId) => {
        event.preventDefault()
        setOverStage(null)
        const candidate = candidates.find((item) => item.key === event.dataTransfer.getData('text/plain'))
        if (!candidate?.report || candidate.stage === stageId) return
        if (stageId === 'assigned') {
            toast.add({ title: 'This candidate already took the interview', description: 'Move them to another stage instead.' })
            return
        }
        setDecision(candidate.report.id, stageId)
    }

    const closeCompare = useCallback(() => setComparing(false), [])

    return (
        <div>
            <PageHeader
                title='Candidates'
                description='Drag candidates between stages as you decide. Tick 2–3 cards to compare them.'
            />

            {loading ? (
                <div className='grid grid-cols-5 gap-3'>
                    {STAGES.map((stage) => <div key={stage.id} className='h-64 animate-pulse rounded-2xl bg-orange-50/60' />)}
                </div>
            ) : !candidates.length ? (
                <EmptyState
                    icon={UsersRound}
                    title='No candidates yet'
                    description='Assign an interview from the dashboard. Candidates appear here as soon as you do.'
                />
            ) : (
                <>
                    <div className='mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center'>
                        <label className='relative w-full sm:max-w-xs'>
                            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder='Search by name or email'
                                className='field h-9 pl-9'
                            />
                        </label>
                        <select value={role} onChange={(event) => setRole(event.target.value)} className='field h-9 cursor-pointer sm:max-w-[240px]'>
                            <option value='all'>All roles</option>
                            {roles.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <p className='shrink-0 text-xs text-slate-500 sm:ml-auto'>{visible.length} candidate{visible.length === 1 ? '' : 's'}</p>
                    </div>

                    <div className='overflow-x-auto pb-24'>
                        <div className='grid min-w-[880px] grid-cols-5 gap-3'>
                            {STAGES.map((stage) => {
                                const isDropTarget = draggingKey && stage.id !== 'assigned'
                                return (
                                    <section
                                        key={stage.id}
                                        onDragOver={(event) => {
                                            if (!isDropTarget) return
                                            event.preventDefault()
                                            setOverStage(stage.id)
                                        }}
                                        onDragLeave={(event) => {
                                            if (!event.currentTarget.contains(event.relatedTarget)) setOverStage(null)
                                        }}
                                        onDrop={(event) => onDrop(event, stage.id)}
                                        className={cn(
                                            'flex min-w-0 flex-col rounded-2xl border p-2 transition-colors',
                                            overStage === stage.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200/50 bg-white/50'
                                        )}
                                    >
                                        <header className='flex items-center gap-2 whitespace-nowrap px-2 pb-2.5 pt-1.5'>
                                            <span className={cn('size-2 shrink-0 rounded-full', stage.dot)} />
                                            <h2 className='text-[13px] font-semibold text-slate-800'>{stage.label}</h2>
                                            <span className='ml-auto rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold tabular-nums text-slate-500'>{byStage[stage.id].length}</span>
                                        </header>
                                        <ul className='flex flex-col gap-2'>
                                            {byStage[stage.id].map((candidate) => (
                                                <CandidateCard
                                                    key={candidate.key}
                                                    candidate={candidate}
                                                    selectable={Boolean(candidate.report)}
                                                    selected={selectedKeys.includes(candidate.key)}
                                                    onToggleSelect={toggleSelect}
                                                    onDragStart={onDragStart}
                                                    onDragEnd={() => { setDraggingKey(null); setOverStage(null) }}
                                                    dragging={draggingKey === candidate.key}
                                                />
                                            ))}
                                            {isDropTarget && overStage === stage.id ? (
                                                <li className='flex h-16 items-center justify-center rounded-xl border-2 border-dashed border-orange-300 text-xs font-medium text-orange-600'>
                                                    Drop to move here
                                                </li>
                                            ) : !byStage[stage.id].length && (
                                                <li className='px-2 pb-3 pt-1 text-xs leading-relaxed text-slate-400'>{stage.empty}</li>
                                            )}
                                        </ul>
                                    </section>
                                )
                            })}
                        </div>
                    </div>
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
