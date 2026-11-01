// Shared role rules, used by both proxy.js (server) and the client UI.

export const ROLES = {
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate',
}

export const ROLE_LABELS = {
  recruiter: 'Recruiter',
  candidate: 'Candidate',
}

const ROLE_HOME = {
  recruiter: '/dashboard',
  candidate: '/candidate/dashboard',
}

// Routes only a given role may open. Anything not listed is open to any signed-in user.
const ROLE_ROUTES = {
  recruiter: ['/dashboard', '/scheduled-interviews', '/all-interviews', '/billing'],
  candidate: ['/candidate'],
}

// Routes anyone can open without signing in.
export const PUBLIC_ROUTES = ['/auth', '/interview']

export function matchesRoute(pathname, routes) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function homeForRole(role) {
  return ROLE_HOME[role] ?? '/onboarding'
}

export function canAccess(role, pathname) {
  return Object.entries(ROLE_ROUTES).every(
    ([owner, routes]) => owner === role || !matchesRoute(pathname, routes)
  )
}

// Only allow same-site relative paths, so `?next=` can't send users to another site.
export function safeNextPath(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    return null
  }
  return next
}
