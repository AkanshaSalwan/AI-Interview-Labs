'use client'
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { buttonVariants } from "@/components/ui/button"
import { ArrowLeftRight, Loader2, LogOut, Mic, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { CandidateSidebarOptions, RecruiterSidebarOptions } from "@/services/Constants"
import { ROLES, ROLE_LABELS, homeForRole } from "@/services/roles"
import { saveActiveRole } from "@/services/userProfile"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/app/provider"
import { createClient } from "@/services/supabaseClient"
import { cn } from "@/lib/utils"
import Logo from '@/components/brand/Logo'

export function AppSidebar() {
    const pathname = usePathname()
    const { user } = useUser()
    const isCandidate = user?.role === ROLES.CANDIDATE
    const options = isCandidate ? CandidateSidebarOptions : RecruiterSidebarOptions

    const [switching, setSwitching] = useState(false)
    const [canRecruit, setCanRecruit] = useState(false)
    const otherRole = isCandidate ? ROLES.RECRUITER : ROLES.CANDIDATE
    // Recruiters can always switch to candidate; candidates only if approved as recruiters.
    const canSwitch = Boolean(user?.role) && (!isCandidate || canRecruit)

    useEffect(() => {
        if (!isCandidate) return
        createClient().rpc('is_approved_recruiter').then(({ data, error }) => {
            if (error) console.error('Recruiter approval check failed:', error.message)
            setCanRecruit(data === true)
        })
    }, [isCandidate, user?.email])

    const switchWorkspace = async () => {
        setSwitching(true)
        try {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()
            await saveActiveRole(supabase, authUser, otherRole)
            window.location.href = homeForRole(otherRole)
        } catch (error) {
            toast.add({ title: 'Could not switch workspace', description: error?.message })
            setSwitching(false)
        }
    }

    const signOut = async () => {
        await createClient().auth.signOut()
        window.location.href = '/auth'
    }

    return (
        <Sidebar className="border-r border-slate-200/80">
            <SidebarHeader className="gap-5 px-4 pt-5">
                <Link href="/" className="block">
                    <Logo priority />
                </Link>
                <Link
                    href={isCandidate ? '/candidate/practice' : '/dashboard/create-interview'}
                    className={cn(
                        buttonVariants(),
                        "h-10 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:opacity-90"
                    )}
                >
                    {isCandidate ? <Mic /> : <Plus />}
                    {isCandidate ? 'Start Practice' : 'Create New Interview'}
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {isCandidate ? 'Candidate' : 'Recruiter'} workspace
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {options.map((option) => {
                            const Icon = option.icon
                            const isActive = pathname === option.path || pathname.startsWith(`${option.path}/`)
                            return (
                                <SidebarMenuItem key={option.path}>
                                    <SidebarMenuButton
                                        render={<Link href={option.path} />}
                                        isActive={isActive}
                                        className={cn(
                                            "h-10 gap-3 rounded-lg px-3 text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700",
                                            isActive && "bg-violet-50 font-medium text-violet-700 data-active:bg-violet-50 data-active:text-violet-700 [&_svg]:text-violet-600"
                                        )}
                                    >
                                        <Icon className="size-[18px]" />
                                        <span className="text-[15px]">{option.name}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="gap-2 p-3">
                {canSwitch && (
                    <button
                        type="button"
                        onClick={switchWorkspace}
                        disabled={switching}
                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60"
                    >
                        {switching ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
                        Switch to {ROLE_LABELS[otherRole]}
                    </button>
                )}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    {user?.picture ? (
                        <Image
                            src={user.picture}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                            {user?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{user?.name ?? 'Loading…'}</p>
                        <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user?.role] ?? user?.email}</p>
                    </div>
                    <button
                        type="button"
                        onClick={signOut}
                        title="Sign out"
                        aria-label="Sign out"
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
