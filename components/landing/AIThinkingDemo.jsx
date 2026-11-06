'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, CheckCircle2, Cpu, Sparkles, User } from 'lucide-react'

// Scripted, looping demo: the candidate's answer streams in word by word while the
// "AI" detects skills, fills a confidence meter and grows a radar chart. Decorative only.
const QUESTION = 'How would you optimize a React application for better performance?'
const ANSWER =
    'First I would use the React Profiler to find slow components. Then I would avoid unnecessary re-renders with React.memo and useMemo, add lazy loading for heavy routes, and virtualize long lists so the page stays fast.'
const WORDS = ANSWER.split(' ')

const SKILLS = [
    { trigger: 'Profiler', label: 'Performance profiling' },
    { trigger: 're-renders', label: 'Render optimization' },
    { trigger: 'React.memo', label: 'Memoization' },
    { trigger: 'lazy loading', label: 'Code splitting' },
    { trigger: 'virtualize', label: 'List virtualization' },
]

const AXES = ['Technical', 'Communication', 'Problem solving', 'Clarity', 'Confidence']
const FINAL = [0.88, 0.9, 0.82, 0.86, 0.76]

const CENTER = 120
const RADIUS = 86

function point(index, value) {
    const angle = (Math.PI * 2 * index) / AXES.length - Math.PI / 2
    return [CENTER + Math.cos(angle) * RADIUS * value, CENTER + Math.sin(angle) * RADIUS * value]
}

function polygon(values) {
    return values.map((value, index) => point(index, value).join(',')).join(' ')
}

function Radar({ progress }) {
    const values = FINAL.map((value) => Math.max(0.08, value * progress))
    return (
        <svg viewBox='-40 -10 320 260' className='w-full max-w-[320px]' aria-hidden='true'>
            <defs>
                <radialGradient id='radar-fill' cx='50%' cy='50%' r='50%'>
                    <stop offset='0%' stopColor='#fb923c' stopOpacity='0.7' />
                    <stop offset='100%' stopColor='#ea580c' stopOpacity='0.25' />
                </radialGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((level) => (
                <polygon key={level} points={polygon(AXES.map(() => level))} fill='none' stroke='rgba(255,255,255,0.08)' />
            ))}
            {AXES.map((axis, index) => {
                const [x, y] = point(index, 1)
                const [lx, ly] = point(index, 1.24)
                return (
                    <g key={axis}>
                        <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke='rgba(255,255,255,0.08)' />
                        <text x={lx} y={ly} fill='#94a3b8' fontSize='9' textAnchor='middle' dominantBaseline='middle'>{axis}</text>
                    </g>
                )
            })}
            <polygon
                points={polygon(values)}
                fill='url(#radar-fill)'
                stroke='#fb923c'
                strokeWidth='2'
                style={{ transition: 'all 300ms ease', filter: 'drop-shadow(0 0 10px rgba(251,146,60,0.6))' }}
            />
            {values.map((value, index) => {
                const [x, y] = point(index, value)
                return <circle key={index} cx={x} cy={y} r='3.5' fill='#fff' stroke='#f97316' strokeWidth='2' />
            })}
        </svg>
    )
}

export default function AIThinkingDemo() {
    const rootRef = useRef(null)
    const [inView, setInView] = useState(false)
    const [phase, setPhase] = useState('ask') // ask -> answer -> analyze -> done
    const [typed, setTyped] = useState(0)
    const [words, setWords] = useState(0)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 })
        if (rootRef.current) observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!inView) return
        let id
        if (phase === 'ask') {
            if (typed < QUESTION.length) id = setTimeout(() => setTyped((v) => v + 1), 28)
            else id = setTimeout(() => setPhase('answer'), 600)
        } else if (phase === 'answer') {
            if (words < WORDS.length) id = setTimeout(() => setWords((v) => v + 1), 170)
            else id = setTimeout(() => setPhase('analyze'), 500)
        } else if (phase === 'analyze') {
            id = setTimeout(() => setPhase('done'), 1600)
        } else {
            id = setTimeout(() => {
                setTyped(0)
                setWords(0)
                setPhase('ask')
            }, 4500)
        }
        return () => clearTimeout(id)
    }, [inView, phase, typed, words])

    const spoken = WORDS.slice(0, words).join(' ')
    const detected = SKILLS.filter((skill) => spoken.includes(skill.trigger))
    const progress = phase === 'analyze' || phase === 'done' ? 1 : words / WORDS.length
    const confidence = Math.round(progress * 87)

    // Highlight skill trigger phrases inside the streamed answer.
    const renderAnswer = () => {
        let parts = [spoken]
        for (const skill of SKILLS) {
            parts = parts.flatMap((part) => {
                if (typeof part !== 'string' || !part.includes(skill.trigger)) return [part]
                const [before, ...rest] = part.split(skill.trigger)
                return [before, { text: skill.trigger }, rest.join(skill.trigger)]
            })
        }
        return parts.map((part, index) =>
            typeof part === 'string' ? (
                <span key={index}>{part}</span>
            ) : (
                <mark key={index} className='lp-pop rounded bg-orange-500/20 px-1 text-orange-300'>{part.text}</mark>
            )
        )
    }

    return (
        <div ref={rootRef} className='grid gap-6 lg:grid-cols-[1.15fr_1fr]'>
            {/* transcript */}
            <div className='rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur'>
                <div className='flex items-center justify-between'>
                    <p className='flex items-center gap-2 text-sm font-semibold text-white'>
                        <span className='relative flex size-2.5'>
                            <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                            <span className='relative inline-flex size-2.5 rounded-full bg-emerald-500' />
                        </span>
                        Live transcript
                    </p>
                    <span className='rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300'>Frontend Developer · Q3 of 5</span>
                </div>

                <div className='mt-6 space-y-5'>
                    <div className='flex gap-3'>
                        <span className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500/20'>
                            <Image src='/Smiling Orange Robot Mascot.png' alt='' width={1312} height={1199} className='size-7 object-contain' />
                        </span>
                        <div className='rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 text-[15px] leading-relaxed text-slate-100'>
                            {QUESTION.slice(0, typed)}
                            {phase === 'ask' && <span className='lp-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-orange-400' />}
                        </div>
                    </div>

                    {phase !== 'ask' && (
                        <div className='lp-pop flex flex-row-reverse gap-3'>
                            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300'>
                                <User className='size-4' />
                            </span>
                            <div className='min-h-[52px] rounded-2xl rounded-tr-sm bg-sky-500/10 px-4 py-3 text-[15px] leading-relaxed text-slate-200'>
                                {renderAnswer()}
                                {phase === 'answer' && <span className='lp-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-sky-400' />}
                            </div>
                        </div>
                    )}
                </div>

                <div className='mt-6 flex items-center gap-3 border-t border-white/10 pt-4 text-xs text-slate-400'>
                    <Cpu className='size-4 text-orange-400' />
                    {phase === 'ask' && 'AI interviewer is speaking…'}
                    {phase === 'answer' && 'Transcribing and analyzing in real time…'}
                    {phase === 'analyze' && 'Generating feedback…'}
                    {phase === 'done' && 'Feedback ready'}
                </div>
            </div>

            {/* analysis */}
            <div className='relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-500/10 to-transparent p-6'>
                {phase === 'analyze' && <div className='lp-scan pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-orange-400/20 to-transparent' />}
                <p className='flex items-center gap-2 text-sm font-semibold text-white'>
                    <BrainCircuit className='size-4 text-orange-400' /> AI analysis
                </p>

                <div className='mt-4'>
                    <div className='flex justify-between text-xs text-slate-400'>
                        <span>Answer confidence</span>
                        <span className='font-semibold tabular-nums text-white'>{confidence}%</span>
                    </div>
                    <div className='mt-2 h-2 overflow-hidden rounded-full bg-white/10'>
                        <div className='h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300' style={{ width: `${confidence}%` }} />
                    </div>
                </div>

                <p className='mt-5 text-xs text-slate-400'>Skills detected</p>
                <div className='mt-2 flex min-h-[64px] flex-wrap content-start gap-2'>
                    {detected.length === 0 && <span className='text-xs text-slate-500'>Listening for key concepts…</span>}
                    {detected.map((skill) => (
                        <span key={skill.label} className='lp-pop flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-200'>
                            <Sparkles className='size-3' /> {skill.label}
                        </span>
                    ))}
                </div>

                <div className='mt-2 flex justify-center'>
                    <Radar progress={progress} />
                </div>

                <div className={`mt-2 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300 transition-all duration-500 ${phase === 'done' ? 'opacity-100' : 'translate-y-2 opacity-0'}`}>
                    <CheckCircle2 className='size-4 shrink-0' /> Strong answer: covers profiling, memoization and code splitting.
                </div>
            </div>
        </div>
    )
}
