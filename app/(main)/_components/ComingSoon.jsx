import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import PageHeader from './PageHeader'

function ComingSoon({ title, description, backHref }) {
    return (
        <div>
            <PageHeader title={title} description={description} />
            <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center'>
                <div className='pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl' />
                <span className='relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'>
                    <Sparkles className='size-7' />
                </span>
                <h2 className='relative mt-5 text-xl font-semibold text-slate-900'>Coming soon</h2>
                <p className='relative mx-auto mt-2 max-w-md text-slate-500'>
                    This part of your workspace is being built and will be available shortly.
                </p>
                <Link href={backHref} className='relative mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700'>
                    <ArrowLeft className='size-4' /> Back to dashboard
                </Link>
            </div>
        </div>
    )
}

export default ComingSoon
