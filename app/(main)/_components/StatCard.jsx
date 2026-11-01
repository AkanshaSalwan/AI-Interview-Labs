import { cn } from '@/lib/utils'

const TONES = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
}

function StatCard({ icon: Icon, label, value, hint, tone = 'violet', loading = false }) {
    return (
        <div className='rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md'>
            <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-slate-500'>{label}</p>
                <span className={cn('flex size-9 items-center justify-center rounded-lg', TONES[tone])}>
                    <Icon className='size-[18px]' />
                </span>
            </div>
            {loading ? (
                <div className='mt-3 h-8 w-16 animate-pulse rounded-md bg-slate-100' />
            ) : (
                <p className='mt-3 text-3xl font-bold tracking-tight text-slate-900'>{value}</p>
            )}
            {hint && <p className='mt-1 text-xs text-slate-400'>{hint}</p>}
        </div>
    )
}

export default StatCard
