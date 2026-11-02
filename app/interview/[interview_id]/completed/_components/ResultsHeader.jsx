'use client'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useUser } from '@/app/provider'
import { ROLE_LABELS } from '@/services/roles'
import Logo from '@/components/brand/Logo'
import AccountMenu, { UserAvatar } from '@/app/(main)/_components/AccountMenu'
import { cn } from '@/lib/utils'

const NAV = [
    { label: 'Practice', href: '/candidate/practice' },
    { label: 'My Interviews', href: '/candidate/interviews' },
    { label: 'Progress', href: '/candidate/progress' },
]

// Slim top bar for the practice results page (no sidebar). Results sit under Progress.
function ResultsHeader({ active = 'Progress' }) {
    const { user } = useUser()

    return (
        <header className='sticky top-0 z-20 border-b border-orange-100/60 bg-white/70 backdrop-blur-md'>
            <div className='mx-auto flex h-16 w-full max-w-[1420px] items-center gap-6 px-4 md:px-10'>
                <Link href='/candidate/dashboard' className='shrink-0'>
                    <Logo size='sm' priority />
                </Link>
                <nav className='hidden items-center gap-1 md:flex'>
                    {NAV.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                                item.label === active ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:text-slate-900'
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className='ml-auto flex items-center gap-3'>
                    {user?.role && (
                        <span className='hidden rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 ring-1 ring-orange-100 sm:inline-block'>
                            {ROLE_LABELS[user.role]}
                        </span>
                    )}
                    <AccountMenu triggerClassName='flex items-center gap-1.5 rounded-full'>
                        <UserAvatar user={user} className='size-8 text-sm' />
                        <ChevronDown className='size-4 text-slate-400' />
                    </AccountMenu>
                </div>
            </div>
        </header>
    )
}

export default ResultsHeader
