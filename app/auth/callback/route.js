import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabaseServer'
import { canAccess, homeForRole, safeNextPath } from '@/services/roles'

// Google OAuth lands here: swap the code for a session, make sure a Users row
// exists, then send the user to their role's home (or onboarding).
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user?.email) {
    console.error('OAuth code exchange failed:', error)
    return NextResponse.redirect(`${origin}/auth?error=login_failed`)
  }

  const authUser = data.user
  const { data: existingUser, error: lookupError } = await supabase
    .from('Users')
    .select('role')
    .eq('email', authUser.email)
    .maybeSingle()

  if (lookupError) {
    console.error('Unable to look up user:', lookupError)
  }

  if (!existingUser && !lookupError) {
    const { error: insertError } = await supabase.from('Users').insert([{
      name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name,
      email: authUser.email,
      picture: authUser.user_metadata?.picture ?? authUser.user_metadata?.avatar_url,
    }])
    if (insertError) {
      console.error('Unable to create user record:', insertError)
    }
  }

  const role = existingUser?.role
  if (!role) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  const destination = next && canAccess(role, next) ? next : homeForRole(role)
  return NextResponse.redirect(`${origin}${destination}`)
}
