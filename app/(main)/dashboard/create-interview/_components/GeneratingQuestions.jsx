'use client'
import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// What the AI is "doing", shown one after another while the questions are generated.
const STEPS = [
    'Reading the role and job description',
    'Choosing the key skills to test',
    'Writing technical questions',
    'Adding behavioural questions',
    'Matching questions to the time limit',
    'Polishing the final list',
]

const STEP_MS = 2200

// Animated placeholder while the AI writes interview questions (HR create flow and candidate practice).
function GeneratingQuestions({ jobPosition }) {
    const [step, setStep] = useState(0)

    useEffect(() => {
        // Stops on the last step: generation can take longer than the animation.
        const timer = setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), STEP_MS)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className='surface overflow-hidden rounded-2xl' role='status' aria-live='polite'>
            <div className='ai-glow relative flex flex-col items-center px-6 pb-6 pt-8 text-center'>
                {/* AI orb */}
                <div className='relative flex size-24 items-center justify-center'>
                    <span className='ai-ring absolute inset-0 rounded-full border border-orange-300/70' />
                    <span className='ai-ring absolute inset-0 rounded-full border border-orange-300/70 [animation-delay:0.8s]' />
                    <span className='ai-orb absolute inset-3 rounded-full' />
                    <span className='absolute inset-[18px] rounded-full bg-white/85 backdrop-blur-sm' />
                    <Sparkles className='ai-sparkle relative size-7 text-orange-500' />
                </div>

                <h2 className='mt-5 text-[17px] font-semibold tracking-tight text-slate-900'>
                    AI is writing your questions
                </h2>
                <p className='mt-1 text-sm text-slate-500'>
                    {jobPosition ? <>Tailored for <span className='font-medium text-slate-700'>{jobPosition}</span></> : 'Tailored to this role'}
                    <span className='ai-dots' aria-hidden />
                </p>

                {/* Progress steps */}
                <ul className='mt-6 w-full max-w-sm space-y-2 text-left'>
                    {STEPS.map((label, index) => {
                        const done = index < step
                        const active = index === step
                        return (
                            <li
                                key={label}
                                className={cn(
                                    'flex items-center gap-2.5 text-[13px] transition-all duration-500',
                                    index > step + 1 ? 'opacity-0' : index > step ? 'opacity-40' : 'opacity-100'
                                )}
                            >
                                <span className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                                    done ? 'bg-emerald-500 text-white' : active ? 'bg-orange-100' : 'bg-slate-100'
                                )}>
                                    {done
                                        ? <Check className='size-3' strokeWidth={3} />
                                        : active && <span className='size-2 animate-ping rounded-full bg-orange-500' />}
                                </span>
                                <span className={cn(done ? 'text-slate-500' : active ? 'font-medium text-slate-900' : 'text-slate-400')}>
                                    {label}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* Question cards "being written" */}
            <div className='space-y-2.5 border-t border-orange-100/70 bg-orange-50/30 px-5 py-4'>
                {[0.92, 0.78, 0.86].map((width, index) => (
                    <div
                        key={index}
                        className='ai-card-in flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100'
                        style={{ animationDelay: `${index * 0.35}s` }}
                    >
                        <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-medium text-orange-600'>
                            {index + 1}
                        </span>
                        <div className='flex-1 space-y-1.5 pt-1'>
                            <div className='ai-shimmer h-2.5 rounded-full' style={{ width: `${width * 100}%` }} />
                            <div className='ai-shimmer h-2.5 rounded-full' style={{ width: `${width * 55}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default GeneratingQuestions
