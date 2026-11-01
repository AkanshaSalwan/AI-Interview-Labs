import React from 'react'
import Image from 'next/image'
import { Input } from '@base-ui/react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Copy, List, Mail, PhoneCall, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'


function InterviewLink({ interview_id, formData, isScreening = false }) {
  const Url = `${process.env.NEXT_PUBLIC_HOST_URL?.replace(/\/+$/, '')}/${interview_id}`

  const GetInterviewUrl = () => {

    return Url;
  }

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(GetInterviewUrl());
    toast.add({ title: 'Link Copied to Clipboard' })
  }

  return (
    <div className='flex flex-col items-center justify-center gap-5'>
      <Image src={'/checked.png'} alt='checked'
        width={80}
        height={80}
        className='w-[80px] h-[80px] '
      />
      <h2 className='font-bold text-lg mt-4'>
        {isScreening ? 'Your Phone Screening Call is Ready' : 'Your AI Interview is Ready'}
      </h2>
      <p className='mt-3'>Share this link with your candidates to start the interview process</p>

      {isScreening && (
        <Link
          href={`/interview/${interview_id}`}
          className='inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40'
        >
          <PhoneCall className='size-5' /> Start Call Now
        </Link>
      )}

      <div className='mx-auto mt-6 w-full max-w-2xl rounded-xl border border-gray-100 bg-white p-6'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='font-bold'>Interview Link</h2>
          <h2 className='whitespace-nowrap rounded-2xl bg-violet-50 px-2 py-1 text-sm text-primary'>Valid for 30 Days</h2>
        </div>
        <div className='mt-2 flex gap-2 items-center'>
          <Input
            defaultValue={GetInterviewUrl()}
            disabled={true}
            className='h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-500 shadow-sm disabled:cursor-default disabled:opacity-100'
          />
          <Button onClick={() => onCopyLink()} ><Copy /> Copy Link</Button>
        </div>
        <hr className='my-5' />

        <div className='flex gap-5 items-center'>
          <h2 className='text-sm text-gray-500 flex items-center gap-2'><Clock className='w-4 h-4' />  {formData?.interviewDuration} minutes</h2>
          <h2 className='text-sm text-gray-500 flex items-center gap-2'><List className='w-4 h-4' /> 10 Questions</h2>
        </div>

      </div>
      <div className='mx-auto mt-7 w-full max-w-2xl rounded-lg bg-white p-5'>
        <h2 className='font-bold'>Share Via</h2>
        <div className='gap-3 mt-3 grid grid-cols-2 md:grid-cols-4'>
          <Button variant={'outline'} className='w-full'><Mail />Email</Button>
          <Button variant={'outline'} className='w-full'><Mail />Slack</Button>
          <Button variant={'outline'} className='w-full'><Mail />WhatsApp</Button>
        </div>

      </div>
      <div className='mx-auto mt-7 w-full max-w-2xl flex gap-3 justify-between'>
        <Link href={'/dashboard'} >
          <Button variant={'outline'}><ArrowLeft /> Back To Dashboard</Button>
        </Link>
        <Link href={'/dashboard/create-interview'} >
          <Button> <Plus />Create New Interview</Button>
        </Link>
      </div>
    </div>
  )
}


export default InterviewLink