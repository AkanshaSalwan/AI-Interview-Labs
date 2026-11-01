import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_ROUTES, canAccess, homeForRole, matchesRoute } from './services/roles'

export async function proxy(request) {
  const { pathname, searchParams } = request.nextUrl

  // If Supabase falls back to the Site URL after Google sign-in, finish the login properly.
  if (pathname === '/' && searchParams.has('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    }
  )

  // Also refreshes the session cookie when the access token has expired.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const redirectTo = (path, query) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = query ? `?${new URLSearchParams(query)}` : ''
    const redirect = NextResponse.redirect(url)
    // Keep any refreshed session cookies on the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  const isPublic = pathname === '/' || matchesRoute(pathname, PUBLIC_ROUTES)

  if (!claims) {
    return isPublic ? response : redirectTo('/auth', { next: pathname })
  }

  // Candidates open interview links whatever their role; the callback sets up the session itself.
  if (matchesRoute(pathname, ['/interview', '/auth/callback'])) {
    return response
  }

  const { data: profile } = await supabase
    .from('Users')
    .select('role')
    .eq('email', claims.email)
    .maybeSingle()
  let role = profile?.role

  // Recruiter access must be approved (migration 005). If it was revoked, move the user to the candidate workspace.
  if (role === 'recruiter') {
    const { data: approved, error: approvalError } = await supabase.rpc('is_approved_recruiter')
    if (approvalError) {
      console.error('Recruiter approval check failed:', approvalError.message)
    } else if (!approved) {
      await supabase.from('Users').update({ role: 'candidate' }).eq('email', claims.email)
      role = 'candidate'
      if (!canAccess(role, pathname)) {
        return redirectTo(homeForRole(role), { notice: 'recruiter_not_approved' })
      }
    }
  }

  if (!role) {
    return pathname === '/onboarding' ? response : redirectTo('/onboarding')
  }

  if (pathname === '/' || pathname === '/onboarding' || pathname === '/auth') {
    return redirectTo(homeForRole(role))
  }

  if (!canAccess(role, pathname)) {
    return redirectTo(homeForRole(role))
  }

  return response
}

export const config = {
  matcher: [
    // Skip API routes, Next.js internals and static files.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
}
