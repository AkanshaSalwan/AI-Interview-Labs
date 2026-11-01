'use client'
import Image from 'next/image'
import { useUser } from '@/app/provider';
import { ROLE_LABELS } from '@/services/roles';
import React from 'react'

function greeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

function WelcomeContainer() {
    const { user } = useUser();
    const firstName = user?.name?.split(' ')[0]

    return (
        <div className='flex flex-1 items-center justify-between gap-4'>
            <div className='min-w-0'>
                <h2 className='truncate text-[15px] font-semibold text-slate-900' suppressHydrationWarning>
                    {greeting()}{firstName ? `, ${firstName}` : ''} 👋
                </h2>
                <p className='truncate text-xs text-slate-500'>AI-driven interviews, hassle-free hiring</p>
            </div>
            <div className='flex items-center gap-3'>
                {user?.role && (
                    <span className='hidden rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 sm:inline-block'>
                        {ROLE_LABELS[user.role]}
                    </span>
                )}
                {user?.picture && (
                    <Image src={user.picture} alt='' width={36} height={36}
                        className='size-9 rounded-full object-cover ring-2 ring-white shadow-sm' />
                )}
            </div>
        </div>
    )
}

export default WelcomeContainer
