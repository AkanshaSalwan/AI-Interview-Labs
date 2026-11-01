import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabaseServer'
import { ROLES, canAccess, homeForRole, safeNextPath } from '@/services/roles'
import { RECRUITER_NOT_APPROVED_NOTICE, saveRoleOrFallBackToCandidate } from '@/services/userProfile'

// Google OAuth and email-confirmation links land here: swap the code for a session,
// apply the role picked on the sign-in page, then send the user to that workspace.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const requestedRole = Object.values(ROLES).includes(searchParams.get('role')) ? searchParams.get('role') : null

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user?.email) {
    console.error('OAuth code exchange failed:', error)
    return NextResponse.redirect(`${origin}/auth?error=login_failed`)
  }

  let role = null
  try {
    if (requestedRole) {
      const { profile, recruiterDenied } = await saveRoleOrFallBackToCandidate(supabase, data.user, requestedRole)
      if (recruiterDenied) {
        return NextResponse.redirect(`${origin}${homeForRole(profile.role)}?notice=${RECRUITER_NOT_APPROVED_NOTICE}`)
      }
      role = profile.role
    } else {
      const { data: existingUser } = await supabase
        .from('Users')
        .select('role')
        .eq('email', data.user.email)
        .maybeSingle()
      role = existingUser?.role ?? null
    }
  } catch (profileError) {
    console.error('Unable to save the user profile:', profileError)
  }

  if (!role) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  const destination = next && canAccess(role, next) ? next : homeForRole(role)
  return NextResponse.redirect(`${origin}${destination}`)
}
