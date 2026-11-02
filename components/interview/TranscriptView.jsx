import Image from 'next/image'
import { MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'

// Chat-style view of a saved interview transcript: [{ role, content }].
function TranscriptView({ transcript, candidateName = 'Candidate', className }) {
    const messages = Array.isArray(transcript)
        ? transcript.filter((message) => message?.content?.trim())
        : []

    if (!messages.length) {
        return (
            <div className='flex flex-col items-center py-8 text-center text-sm text-slate-500'>
                <MessageSquareText className='mb-2 size-6 text-slate-300' />
                No transcript was saved for this interview.
            </div>
        )
    }

    return (
        <ol className={cn('space-y-4', className)}>
            {messages.map((message, index) => {
                const isAssistant = message.role === 'assistant'
                return (
                    <li key={index} className={cn('flex items-end gap-2.5', !isAssistant && 'flex-row-reverse')}>
                        {isAssistant ? (
                            <Image src='/ai.png' alt='' width={32} height={32} className='size-8 shrink-0 rounded-full object-cover' />
                        ) : (
                            <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white'>
                                {candidateName?.[0]?.toUpperCase() ?? 'C'}
                            </span>
                        )}
                        <div className={cn('max-w-[80%]', !isAssistant && 'text-right')}>
                            <p className='mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400'>
                                {isAssistant ? 'AI Recruiter' : candidateName}
                            </p>
                            <p className={cn(
                                'whitespace-pre-line rounded-2xl px-4 py-2.5 text-left text-[13px] leading-relaxed',
                                isAssistant
                                    ? 'rounded-bl-sm bg-[#f7f1eb] text-slate-700'
                                    : 'rounded-br-sm bg-orange-500 text-white'
                            )}>
                                {message.content}
                            </p>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

export default TranscriptView
