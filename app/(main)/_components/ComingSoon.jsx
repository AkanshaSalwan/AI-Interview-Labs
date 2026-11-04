import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import PageHeader from './PageHeader'

function ComingSoon({ title, description, backHref }) {
    return (
        <div>
            <PageHeader title={title} description={description} />
            <div className='surface rounded-2xl px-6 py-14 text-center'>
                <span className='mx-auto flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
                    <Sparkles className='size-6' strokeWidth={1.75} />
                </span>
                <h2 className='mt-4 text-lg font-semibold text-slate-900'>Coming soon</h2>
                <p className='mx-auto mt-1.5 max-w-md text-sm text-slate-500'>
                    This part of your workspace is being built and will be available shortly.
                </p>
                <Link href={backHref} className='mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700'>
                    <ArrowLeft className='size-4' /> Back to dashboard
                </Link>
            </div>
        </div>
    )
}

export default ComingSoon
