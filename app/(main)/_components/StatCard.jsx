import { cn } from '@/lib/utils'

const TONES = {
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
}

function StatCard({ icon: Icon, label, value, hint, tone = 'orange', loading = false }) {
    return (
        <div className='surface rounded-2xl p-4'>
            <div className='flex items-center justify-between gap-3'>
                <p className='text-[13px] font-medium text-slate-500'>{label}</p>
                <span className={cn('flex size-8 items-center justify-center rounded-lg', TONES[tone])}>
                    <Icon className='size-4' strokeWidth={2} />
                </span>
            </div>
            {loading ? (
                <div className='mt-2 h-7 w-14 animate-pulse rounded-md bg-slate-100' />
            ) : (
                <p className='mt-1.5 text-2xl font-semibold tracking-tight text-slate-900'>{value}</p>
            )}
            {hint && <p className='mt-0.5 text-xs text-slate-400'>{hint}</p>}
        </div>
    )
}

export default StatCard
