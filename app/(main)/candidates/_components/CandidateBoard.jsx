'use client'
import { useState } from 'react'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import CandidateCard from './CandidateCard'
import { STAGES } from './pipeline'

// Kanban view: one column per stage. Finished interviews can be dragged to another stage.
function CandidateBoard({ candidates, selectedKeys, onToggleSelect, onMove, onOpen }) {
    const [draggingKey, setDraggingKey] = useState(null)
    const [overStage, setOverStage] = useState(null)

    const byStage = Object.fromEntries(STAGES.map((stage) => [
        stage.id,
        candidates.filter((candidate) => candidate.stage === stage.id).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    ]))

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
        onMove(candidate, stageId)
    }

    return (
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
                                        onToggleSelect={onToggleSelect}
                                        onDragStart={onDragStart}
                                        onDragEnd={() => { setDraggingKey(null); setOverStage(null) }}
                                        dragging={draggingKey === candidate.key}
                                        onOpen={onOpen}
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
    )
}

export default CandidateBoard
