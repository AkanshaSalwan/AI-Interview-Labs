import { ROLES } from './roles'

export const RECRUITER_NOT_APPROVED_NOTICE = 'recruiter_not_approved'

// The database trigger (migration 005) rejects the recruiter role for unapproved emails.
export function isRecruiterNotApproved(error) {
  return String(error?.message ?? '').includes('RECRUITER_NOT_APPROVED')
}

// Sets the workspace (role) the user is working in, creating their Users row if needed.
// Works with both the browser and the server Supabase client.
export async function saveActiveRole(supabase, authUser, role) {
  if (!Object.values(ROLES).includes(role)) {
    throw new Error(`Unknown role: ${role}`)
  }
  if (!authUser?.email) {
    throw new Error('You are not signed in.')
  }

  const { data: updated, error: updateError } = await supabase
    .from('Users')
    .update({ role })
    .eq('email', authUser.email)
    .select()
  if (updateError) throw updateError
  if (updated?.length) return updated[0]

  const { data: inserted, error: insertError } = await supabase
    .from('Users')
    .insert([{
      name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name,
      email: authUser.email,
      picture: authUser.user_metadata?.picture ?? authUser.user_metadata?.avatar_url,
      role,
    }])
    .select()
    .single()
  if (insertError) throw insertError
  return inserted
}

// Like saveActiveRole, but an unapproved recruiter falls back to the candidate workspace.
export async function saveRoleOrFallBackToCandidate(supabase, authUser, role) {
  try {
    return { profile: await saveActiveRole(supabase, authUser, role), recruiterDenied: false }
  } catch (error) {
    if (role !== ROLES.RECRUITER || !isRecruiterNotApproved(error)) throw error
    return { profile: await saveActiveRole(supabase, authUser, ROLES.CANDIDATE), recruiterDenied: true }
  }
}
