// NEXT_PUBLIC_HOST_URL must point at the interview route, e.g. http://localhost:3000/interview
export function interviewUrl(interviewId) {
  return `${process.env.NEXT_PUBLIC_HOST_URL?.replace(/\/+$/, '')}/${interviewId}`
}

// Opens the user's mail app with an invitation already written.
export function openInviteEmail({ to = '', jobPosition, interviewId, candidateName }) {
  const subject = encodeURIComponent(`Interview invitation: ${jobPosition ?? 'AI Interview'}`)
  const body = encodeURIComponent(
    `Hi${candidateName ? ` ${candidateName}` : ''},\n\n` +
    `You're invited to an AI voice interview for the ${jobPosition ?? ''} role.\n\n` +
    `Start it here when you're ready:\n${interviewUrl(interviewId)}\n\n` +
    `Tip: sign in with this email address to see the interview in your candidate dashboard.\n\nGood luck!`
  )
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`
}
