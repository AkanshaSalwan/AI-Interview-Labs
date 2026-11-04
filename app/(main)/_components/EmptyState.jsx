function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className='flex flex-col items-center rounded-2xl border border-dashed border-orange-200/80 bg-white/70 px-6 py-10 text-center'>
            <span className='flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
                <Icon className='size-5' strokeWidth={1.75} />
            </span>
            <h3 className='mt-3 text-[15px] font-semibold text-slate-900'>{title}</h3>
            {description && <p className='mt-1 max-w-sm text-sm text-slate-500'>{description}</p>}
            {action && <div className='mt-5'>{action}</div>}
        </div>
    )
}

export default EmptyState
