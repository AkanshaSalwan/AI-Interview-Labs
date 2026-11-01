function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className='flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center'>
            <span className='flex size-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600'>
                <Icon className='size-6' />
            </span>
            <h3 className='mt-4 font-semibold text-slate-900'>{title}</h3>
            {description && <p className='mt-1 max-w-sm text-sm text-slate-500'>{description}</p>}
            {action && <div className='mt-6'>{action}</div>}
        </div>
    )
}

export default EmptyState
