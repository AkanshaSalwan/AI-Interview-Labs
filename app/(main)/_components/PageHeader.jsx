function PageHeader({ title, description, action }) {
    return (
        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
                <h1 className='text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]'>{title}</h1>
                {description && <p className='mt-1 text-[15px] text-slate-500'>{description}</p>}
            </div>
            {action}
        </div>
    )
}

export default PageHeader
