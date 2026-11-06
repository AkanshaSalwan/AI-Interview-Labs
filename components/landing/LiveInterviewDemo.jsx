'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2, Ellipsis, Mic, Phone, Sparkles, Video } from 'lucide-react'

// A scripted, looping demo of an AI interview (decorative, not interactive):
// AI asks (typewriter) -> candidate answers (listening) -> AI analyzes -> scores animate in -> next role.
// Frameless design: the robot floats on a round glow with rounded chips around it (no boxed card).
const SCRIPT = [
    {
        role: 'Frontend Developer',
        question: 'How would you optimize a React application for better performance?',
        scores: [8, 9, 7],
    },
    {
        role: 'Backend Engineer',
        question: 'How would you design a rate limiter for a public API?',
        scores: [9, 8, 8],
    },
    {
        role: 'Data Analyst',
        question: 'Walk me through how you would clean a messy dataset.',
        scores: [7, 9, 9],
    },
]

const SCORE_LABELS = ['Technical', 'Communication', 'Problem solving']

const PHASE_MS = { listening: 3200, analyzing: 1900, scored: 2800 }
const TYPE_MS = 32

const STATUS = {
    asking: { icon: Sparkles, text: 'AI is asking', className: 'text-orange-600 bg-orange-50' },
    listening: { icon: Mic, text: 'Listening', className: 'text-emerald-600 bg-emerald-50' },
    analyzing: { icon: BrainCircuit, text: 'Analyzing', className: 'text-violet-600 bg-violet-50' },
    scored: { icon: CheckCircle2, text: 'Scored', className: 'text-slate-600 bg-slate-100' },
}

// Bar heights (px) for the small voice equalizer.
const BARS = [6, 11, 8, 14, 9, 12, 6]

const RING_RADIUS = 18
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function Equalizer({ active }) {
    return (
        <span className='flex h-4 items-center gap-[2px]' aria-hidden='true'>
            {BARS.map((height, index) => (
                <span
                    key={index}
                    className={`w-[2px] rounded-full bg-orange-400 ${active ? 'lp-eq' : ''}`}
                    style={{ height: active ? height : 3, animationDelay: `${(index % 4) * 0.12}s`, transition: 'height 300ms ease' }}
                />
            ))}
        </span>
    )
}

function ScoreRing({ label, value, pending, index }) {
    const offset = pending ? RING_LENGTH : RING_LENGTH * (1 - value / 10)
    return (
        <div className='flex flex-col items-center gap-1'>
            <div className='relative size-12'>
                <svg viewBox='0 0 44 44' className='size-full -rotate-90'>
                    <circle cx='22' cy='22' r={RING_RADIUS} fill='none' stroke='#f1f5f9' strokeWidth='3' />
                    <circle
                        cx='22'
                        cy='22'
                        r={RING_RADIUS}
                        fill='none'
                        stroke='#fb923c'
                        strokeWidth='3'
                        strokeLinecap='round'
                        strokeDasharray={RING_LENGTH}
                        strokeDashoffset={offset}
                        style={{ transition: `stroke-dashoffset 900ms ease-out ${index * 150}ms` }}
                    />
                </svg>
                <span className='absolute inset-0 flex items-center justify-center text-[11px] font-medium tabular-nums text-slate-700'>
                    {pending ? '…' : value}
                </span>
            </div>
            <span className='text-[10px] text-slate-500'>{label}</span>
        </div>
    )
}

function DockButton({ children, danger = false, pulse = false }) {
    return (
        <span
            className={`relative flex size-9 items-center justify-center rounded-full ${danger ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-500'}`}
        >
            {pulse && <span className='lp-ping absolute inset-0 rounded-full border border-emerald-400' />}
            {children}
        </span>
    )
}

function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
}

export default function LiveInterviewDemo() {
    const [step, setStep] = useState(0)
    const [phase, setPhase] = useState('asking')
    const [typed, setTyped] = useState(0)
    const [seconds, setSeconds] = useState(252)
    // Start with sample scores so the rings never show 0.
    const [scores, setScores] = useState([7, 8, 7])

    const current = SCRIPT[step]

    // REC timer.
    useEffect(() => {
        const id = setInterval(() => setSeconds((value) => value + 1), 1000)
        return () => clearInterval(id)
    }, [])

    // Typewriter while the AI is asking.
    useEffect(() => {
        if (phase !== 'asking') return
        if (typed < current.question.length) {
            const id = setTimeout(() => setTyped((value) => value + 1), TYPE_MS)
            return () => clearTimeout(id)
        }
        const id = setTimeout(() => setPhase('listening'), 700)
        return () => clearTimeout(id)
    }, [phase, typed, current.question.length])

    // Advance through listening -> analyzing -> scored -> next question.
    useEffect(() => {
        if (phase === 'asking') return
        const id = setTimeout(() => {
            if (phase === 'listening') setPhase('analyzing')
            else if (phase === 'analyzing') {
                setScores(current.scores)
                setPhase('scored')
            } else {
                setStep((value) => (value + 1) % SCRIPT.length)
                setTyped(0)
                setPhase('asking')
            }
        }, PHASE_MS[phase])
        return () => clearTimeout(id)
    }, [phase, current.scores])

    const status = STATUS[phase]
    const StatusIcon = status.icon
    const speaking = phase === 'asking'

    return (
        <div className='relative mx-auto h-[540px] w-full max-w-[600px]' aria-hidden='true'>
            {/* round glow + slowly turning dashed ring */}
            <div className='absolute left-1/2 top-[52%] size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(253,186,116,0.35),rgba(255,237,213,0.25)_45%,transparent_70%)]' />
            <div className='lp-orbit absolute left-1/2 top-[52%] -ml-[200px] -mt-[200px] size-[400px] rounded-full border border-dashed border-orange-200' style={{ animationDuration: '60s' }}>
                <span className='absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300' />
            </div>
            <div className={`absolute left-1/2 top-[52%] size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/30 blur-3xl transition-opacity duration-700 ${speaking ? 'opacity-100' : 'opacity-40'}`} />

            {/* robot, no frame */}
            <Image
                src='/robot-laptop.png'
                alt=''
                width={1536}
                height={1024}
                className='lp-float absolute left-1/2 top-[52%] h-auto w-[88%] -translate-x-1/2 -translate-y-1/2'
                priority
            />

            {/* AI question speech bubble */}
            <div className='absolute left-0 top-4 w-[300px] rounded-3xl rounded-bl-md border border-slate-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur'>
                <div className='flex items-center justify-between gap-3'>
                    <p className='flex items-center gap-1.5 text-[11px] text-slate-500'>
                        <span className='relative flex size-1.5'>
                            <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                            <span className='relative inline-flex size-1.5 rounded-full bg-emerald-500' />
                        </span>
                        <span key={current.role} className='lp-fade-in'>Live · {current.role}</span>
                    </p>
                    <Equalizer active={speaking} />
                </div>
                <p className='mt-1.5 min-h-[40px] text-[13px] leading-snug text-slate-700'>
                    {current.question.slice(0, phase === 'asking' ? typed : undefined)}
                    {phase === 'asking' && <span className='lp-caret ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-orange-400' />}
                </p>
            </div>

            {/* REC + status pills */}
            <div className='absolute right-2 top-8 flex flex-col items-end gap-2'>
                <span className='flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] tabular-nums text-slate-500 shadow-sm backdrop-blur'>
                    <span className='size-1.5 animate-pulse rounded-full bg-red-400' /> REC {formatTime(seconds)}
                </span>
                <span key={phase} className={`lp-pop flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${status.className}`}>
                    <StatusIcon className='size-3' /> {status.text}
                    {phase === 'listening' && (
                        <span className='ml-0.5 flex gap-0.5'>
                            <span className='lp-dot size-1 rounded-full bg-emerald-500' />
                            <span className='lp-dot size-1 rounded-full bg-emerald-500' style={{ animationDelay: '0.15s' }} />
                            <span className='lp-dot size-1 rounded-full bg-emerald-500' style={{ animationDelay: '0.3s' }} />
                        </span>
                    )}
                </span>
            </div>

            {/* score rings in a pill */}
            <div className='lp-float-slow absolute bottom-16 right-0 flex items-center gap-4 rounded-full border border-slate-100 bg-white/85 px-5 py-3 shadow-sm backdrop-blur'>
                {SCORE_LABELS.map((label, index) => (
                    <ScoreRing key={label} label={label} value={scores[index]} pending={phase === 'analyzing'} index={index} />
                ))}
            </div>

            {/* call controls dock */}
            <div className='absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-100 bg-white/85 p-1.5 shadow-sm backdrop-blur'>
                <DockButton pulse={phase === 'listening'}><Mic className='size-4' /></DockButton>
                <DockButton><Video className='size-4' /></DockButton>
                <DockButton><Ellipsis className='size-4' /></DockButton>
                <DockButton danger><Phone className='size-4 rotate-[135deg]' /></DockButton>
            </div>
        </div>
    )
}
