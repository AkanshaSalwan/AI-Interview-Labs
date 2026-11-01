'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, BriefcaseBusiness, Check, GraduationCap, Loader2 } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { ROLES, homeForRole } from '@/services/roles'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  {
    value: ROLES.RECRUITER,
    icon: BriefcaseBusiness,
    title: 'I’m hiring',
    subtitle: 'Recruiter / HR',
    points: [
      'Create AI voice interviews in minutes',
      'Invite candidates with a single link',
      'Review scored reports and shortlist',
    ],
  },
  {
    value: ROLES.CANDIDATE,
    icon: GraduationCap,
    title: 'I’m interviewing',
    subtitle: 'Candidate',
    points: [
      'Practice with a realistic AI interviewer',
      'Take interviews recruiters send you',
      'Track your scores as you improve',
    ],
  },
]

function Onboarding() {
  const router = useRouter()
  const { user, setUser } = useUser()
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const saveRole = async () => {
    if (!selected) return
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser?.email) throw authError ?? new Error('You are not signed in.')

      const { data: updated, error: updateError } = await supabase
        .from('Users')
        .update({ role: selected })
        .eq('email', authUser.email)
        .select()
      if (updateError) throw updateError

      let profile = updated?.[0]
      if (!profile) {
        // No Users row yet (e.g. the sign-in insert failed) — create it with the role.
        const { data: inserted, error: insertError } = await supabase
          .from('Users')
          .insert([{
            name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name,
            email: authUser.email,
            picture: authUser.user_metadata?.picture ?? authUser.user_metadata?.avatar_url,
            role: selected,
          }])
          .select()
          .single()
        if (insertError) throw insertError
        profile = inserted
      }

      setUser(profile)
      router.replace(homeForRole(selected))
      router.refresh()
    } catch (error) {
      // Supabase errors print as {} in the console, so log their fields explicitly.
      console.error('Unable to save role:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      })
      toast.add({ title: 'Could not save your choice', description: error?.message || 'Please try again.' })
      setSaving(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl" />

      <div className="relative w-full max-w-3xl">
        <Image
          src="/AI Interview Voice Agent Logo.png"
          alt="AI Interview"
          width={2172}
          height={724}
          priority
          className="mx-auto h-auto w-[170px]"
        />

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! How will you use AI Interview?
          </h1>
          <p className="mt-3 text-slate-500">
            We’ll set up your workspace for you. You can’t change this later, so pick the one that fits.
          </p>
        </div>

        <div role="radiogroup" aria-label="Choose your role" className="mt-10 grid gap-5 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = selected === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(option.value)}
                className={cn(
                  'group relative cursor-pointer rounded-2xl border-2 bg-white p-6 text-left transition-all duration-200',
                  isSelected
                    ? 'border-violet-600 shadow-xl shadow-violet-500/15'
                    : 'border-slate-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg'
                )}
              >
                <span
                  className={cn(
                    'absolute right-5 top-5 flex size-6 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300'
                  )}
                >
                  {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                </span>

                <div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-xl transition-colors',
                    isSelected
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white'
                      : 'bg-violet-50 text-violet-600'
                  )}
                >
                  <Icon className="size-6" />
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-violet-600">{option.subtitle}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{option.title}</h2>

                <ul className="mt-4 space-y-2.5">
                  {option.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={saveRole}
            disabled={!selected || saving}
            className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-8 font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : null}
            {saving ? 'Setting up your workspace…' : 'Continue'}
            {!saving && <ArrowRight className="size-5" />}
          </button>
        </div>
      </div>
    </main>
  )
}

export default Onboarding
