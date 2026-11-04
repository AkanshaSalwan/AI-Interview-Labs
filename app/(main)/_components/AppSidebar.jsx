'use client'
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
import { ArrowLeftRight, ChevronRight, Loader2, Mic, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { CandidateSidebarOptions, RecruiterSidebarOptions } from "@/services/Constants"
import { ROLES, ROLE_LABELS, homeForRole } from "@/services/roles"
import { saveActiveRole } from "@/services/userProfile"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/app/provider"
import { createClient } from "@/services/supabaseClient"
import { cn } from "@/lib/utils"
import Logo from '@/components/brand/Logo'
import AccountMenu, { UserAvatar } from "./AccountMenu"

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

    return (
        <Sidebar className="app-sidebar-paper border-r border-orange-100/80 [--sidebar:transparent]">
            <SidebarHeader className="gap-5 px-4 pt-5">
                <Link href="/" className="block">
                    <Logo size="lg" priority />
                </Link>
                <Link
                    href={isCandidate ? '/candidate/practice' : '/dashboard/create-interview'}
                    className="btn-orange flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
                >
                    {isCandidate ? <Mic className="size-4" /> : <Plus className="size-4" />}
                    {isCandidate ? 'Start Practice' : 'New interview'}
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 pt-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        {isCandidate ? 'Candidate workspace' : 'HR portal'}
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
                                            "h-9 gap-3 rounded-lg px-3 text-slate-600 transition-colors hover:bg-orange-50/70 hover:text-slate-900 [&_svg]:size-[18px]! [&_svg]:text-slate-500",
                                            isActive && "bg-orange-50 font-medium text-slate-900 data-active:bg-orange-50 data-active:text-slate-900 [&_svg]:text-orange-500"
                                        )}
                                    >
                                        <Icon />
                                        <span className="text-sm">{option.name}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="gap-3 px-4 pb-5">
                {canSwitch && (
                    <button
                        type="button"
                        onClick={switchWorkspace}
                        disabled={switching}
                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60"
                    >
                        {switching ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
                        Switch to {ROLE_LABELS[otherRole]}
                    </button>
                )}
                <AccountMenu
                    placement="top"
                    triggerClassName="flex w-full items-center gap-3 rounded-xl border border-orange-100/80 bg-white p-2.5 text-left transition-colors hover:bg-orange-50/60"
                >
                    <UserAvatar user={user} className="size-9 text-sm" />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{user?.name ?? 'Loading…'}</span>
                        <span className="block truncate text-xs text-slate-500">{ROLE_LABELS[user?.role] ?? user?.email}</span>
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                </AccountMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
