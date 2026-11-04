'use client'
import React, { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, Copy, Mail, MessageCircle, PhoneCall, Plus, Hash, UsersRound } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { interviewUrl, openInviteEmail } from '@/services/interviewLinks'
import InviteCandidateForm from '@/app/(main)/scheduled-interviews/[interview_id]/_components/InviteCandidateForm'


function InterviewLink({ interview_id, formData, isScreening = false }) {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useUser()
  const url = interviewUrl(interview_id)
  const jobPosition = formData?.jobPosition
  const shareMessage = `You're invited to an AI voice interview for the ${jobPosition ?? ''} role. Start it here when you're ready: ${url}`

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Link Copied to Clipboard' })
  }

  const SHARE_OPTIONS = [
    { label: 'Email', icon: Mail, onClick: () => openInviteEmail({ jobPosition, interviewId: interview_id }) },
    { label: 'WhatsApp', icon: MessageCircle, onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener') },
    {
      // Slack has no share link, so copy a ready-made message to paste into a channel or DM.
      label: 'Slack',
      icon: Hash,
      onClick: async () => {
        await navigator.clipboard.writeText(shareMessage)
        toast.add({ title: 'Message copied', description: 'Paste it into Slack.' })
      },
    },
  ]

  return (
    <div className='mx-auto max-w-2xl space-y-4'>
      <div className='text-center'>
        <span className='mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
          <CheckCircle2 className='size-6' />
        </span>
        <h2 className='mt-3 text-xl font-semibold tracking-tight text-slate-900'>
          {isScreening ? 'Your phone screening call is ready' : 'Your AI interview is ready'}
        </h2>
        <p className='mt-1 text-sm text-slate-500'>Assign it to candidates below, or share the link yourself.</p>
        {isScreening && (
          <Link
            href={`/interview/${interview_id}`}
            className='btn-orange mt-4 inline-flex h-10 items-center gap-2 rounded-[0.625rem] px-5 text-sm font-medium text-white hover:brightness-105'
          >
            <PhoneCall className='size-4' /> Start call now
          </Link>
        )}
      </div>

      {user?.email && (
        <InviteCandidateForm
          supabase={supabase}
          interview={{ interview_id, jobPosition }}
          recruiterEmail={user.email}
          onInvited={() => {}}
        />
      )}

      <div className='surface rounded-2xl p-5'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-[15px] font-semibold text-slate-900'>Interview link</h2>
          <span className='flex items-center gap-1 text-xs text-slate-500'><Clock className='size-3.5' /> {formData?.interviewDuration} min</span>
        </div>
        <div className='mt-3 flex gap-2'>
          <input readOnly value={url} onFocus={(event) => event.target.select()} className='field text-xs text-slate-500' />
          <button
            type='button'
            onClick={onCopyLink}
            className='inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[0.625rem] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50'
          >
            <Copy className='size-4' /> Copy
          </button>
        </div>
        <div className='mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4'>
          {SHARE_OPTIONS.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type='button'
              onClick={onClick}
              className='inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[0.625rem] border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-700'
            >
              <Icon className='size-4' /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className='flex justify-between gap-3 pt-2'>
        <Link href='/dashboard' className='inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50'>
          <ArrowLeft className='size-4' /> Dashboard
        </Link>
        <div className='flex gap-2'>
          <Link href={`/scheduled-interviews/${interview_id}`} className='inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50'>
            <UsersRound className='size-4' /> Candidates
          </Link>
          <Link href='/dashboard/create-interview' className='btn-orange inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-3.5 text-sm font-medium text-white hover:brightness-105'>
            <Plus className='size-4' /> New interview
          </Link>
        </div>
      </div>
    </div>
  )
}


export default InterviewLink
