import React from 'react'
import { ArrowRight, Phone, Video } from 'lucide-react'
import Link from 'next/link'

function CreateOptions() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <Link
        href={'/dashboard/create-interview'}
        className='group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-6 text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30'
      >
        <div className='pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl' />
        <span className='relative flex size-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur'>
          <Video className='size-6' />
        </span>
        <h2 className='relative mt-5 text-lg font-semibold'>Create New Interview</h2>
        <p className='relative mt-1 text-violet-100'>Generate questions with AI and share an interview link with candidates.</p>
        <span className='relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium'>
          Get started <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
        </span>
      </Link>

      <Link
        href={'/dashboard/create-interview?mode=screening'}
        className='group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg'
      >
        <span className='flex size-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600'>
          <Phone className='size-6' />
        </span>
        <h2 className='mt-5 text-lg font-semibold text-slate-900'>Create Phone Screening Call</h2>
        <p className='mt-1 text-slate-500'>Schedule a short AI phone screen before the full interview.</p>
        <span className='mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600'>
          Set up a screen <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
        </span>
      </Link>
    </div>
  )
}

export default CreateOptions
