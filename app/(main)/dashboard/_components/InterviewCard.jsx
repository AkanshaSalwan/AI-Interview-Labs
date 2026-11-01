'use client'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, Copy, Send } from 'lucide-react'
import moment from 'moment/moment'
import React from 'react'
import { toast } from '@/components/ui/toast'
import { interviewUrl, openInviteEmail } from '@/services/interviewLinks'


function InterviewCard({ interview }) {

    const url = interviewUrl(interview?.interview_id)
    const types = String(interview?.type ?? '').split(',').map((type) => type.trim()).filter(Boolean)

    const copyLink = async () => {
        await navigator.clipboard.writeText(url)
        toast.add({ title: 'Link Copied to Clipboard' })
    }
    const onSend = () => {
        openInviteEmail({ jobPosition: interview?.jobPosition, interviewId: interview?.interview_id })
    }

    return (
        <div className='group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70'>
            <div className='flex items-start justify-between gap-3'>
                <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-semibold text-white'>
                    {interview?.jobPosition?.[0]?.toUpperCase() ?? 'I'}
                </span>
                <span className='flex items-center gap-1.5 text-xs text-slate-500'>
                    <CalendarDays className='size-3.5' />
                    {moment(interview?.created_at).format('DD MMM YYYY')}
                </span>
            </div>

            <h2 className='mt-4 line-clamp-1 text-lg font-semibold text-slate-900'>{interview?.jobPosition}</h2>
            <p className='mt-1 flex items-center gap-1.5 text-sm text-slate-500'>
                <Clock className='size-3.5' /> {interview?.duration} minutes
            </p>

            {types.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-1.5'>
                    {types.map((type) => (
                        <span key={type} className='rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700'>{type}</span>
                    ))}
                </div>
            )}

            <div className='mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4'>
                <Button variant='outline' className='h-9' onClick={copyLink}><Copy /> Copy Link</Button>
                <Button className='h-9' onClick={onSend}><Send /> Send</Button>
            </div>
        </div>
    )
}

export default InterviewCard
