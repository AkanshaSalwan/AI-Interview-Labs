'use client'
import { ChevronDown } from 'lucide-react'
import { useUser } from '@/app/provider';
import { ROLE_LABELS } from '@/services/roles';
import AccountMenu, { UserAvatar } from '../../_components/AccountMenu'
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
            <div className='flex items-center gap-4'>
                {user?.role && (
                    <span className='hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 ring-1 ring-orange-100 sm:inline-block'>
                        {ROLE_LABELS[user.role]}
                    </span>
                )}
                <AccountMenu triggerClassName='flex items-center gap-2 rounded-full'>
                    <UserAvatar user={user} className='size-9 text-sm ring-2 ring-white' />
                    <ChevronDown className='size-4 text-slate-400' />
                </AccountMenu>
            </div>
        </div>
    )
}

export default WelcomeContainer
