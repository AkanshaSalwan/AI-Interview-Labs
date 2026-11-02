'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { cn } from '@/lib/utils'

export function UserAvatar({ user, className }) {
    if (user?.picture) {
        return (
            <Image
                src={user.picture}
                alt=''
                width={40}
                height={40}
                className={cn('size-10 shrink-0 rounded-full object-cover', className)}
            />
        )
    }
    return (
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3a2f2b] text-base font-semibold text-white', className)}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
        </span>
    )
}

// Button that opens a small account menu (sign out). `placement` decides where the menu opens.
function AccountMenu({ children, placement = 'bottom', className, triggerClassName, label = 'Account menu' }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const onPointer = (event) => {
            if (!ref.current?.contains(event.target)) setOpen(false)
        }
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const signOut = async () => {
        await createClient().auth.signOut()
        window.location.href = '/auth'
    }

    return (
        <div ref={ref} className={cn('relative', className)}>
            <button
                type='button'
                onClick={() => setOpen((value) => !value)}
                aria-haspopup='menu'
                aria-expanded={open}
                aria-label={label}
                className={cn('cursor-pointer', triggerClassName)}
            >
                {children}
            </button>
            {open && (
                <div
                    role='menu'
                    className={cn(
                        'absolute z-40 min-w-44 rounded-xl border border-orange-100 bg-white p-1 shadow-lg shadow-orange-900/10',
                        placement === 'top' ? 'inset-x-0 bottom-full mb-2' : 'right-0 top-full mt-2'
                    )}
                >
                    <button
                        type='button'
                        role='menuitem'
                        onClick={signOut}
                        className='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-700'
                    >
                        <LogOut className='size-4' /> Sign out
                    </button>
                </div>
            )}
        </div>
    )
}

export default AccountMenu
