import { overallScore } from '@/services/scores'

// Hiring stages, left to right. Every stage except "assigned" is a recruiter_status value.
export const STAGES = [
// `dot` marks the stage everywhere, `pill` is its badge in the list, `tint` its summary card.
    { id: 'assigned', label: 'Assigned', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700', tint: 'bg-blue-50/50', empty: 'Candidates who haven’t taken the interview yet' },
    { id: 'pending', label: 'To review', dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700', tint: 'bg-orange-50/60', empty: 'Finished interviews wait here for your decision' },
    { id: 'shortlisted', label: 'Shortlisted', dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700', tint: 'bg-violet-50/50', empty: 'Drag strong candidates here for the next round' },
    { id: 'hired', label: 'Hired', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700', tint: 'bg-emerald-50/50', empty: 'Drag your final pick here' },
    { id: 'rejected', label: 'Rejected', dot: 'bg-red-500', pill: 'bg-red-50 text-red-600', tint: 'bg-red-50/50', empty: 'Candidates you won’t move forward' },
]

const DECISION_STAGES = new Set(['pending', 'shortlisted', 'hired', 'rejected'])

// One entry per candidate per interview: their latest report (if any) merged with their invite (if any).
export function buildCandidates(interviews, invites, reports) {
    const interviewById = Object.fromEntries(interviews.map((item) => [item.interview_id, item]))
    const byKey = new Map()

    // Reports arrive newest first, so the first one per candidate is their latest.
    for (const report of reports) {
        const email = report.userEmail?.toLowerCase() || `report-${report.id}`
        const key = `${report.interview_id}|${email}`
        if (byKey.has(key) || !interviewById[report.interview_id]) continue
        byKey.set(key, {
            key,
            interview: interviewById[report.interview_id],
            name: report.userName,
            email: report.userEmail,
            report,
            score: overallScore(report),
            stage: DECISION_STAGES.has(report.recruiter_status) ? report.recruiter_status : 'pending',
            date: report.created_at,
        })
    }

    for (const invite of invites) {
        const key = `${invite.interview_id}|${invite.candidate_email.toLowerCase()}`
        const existing = byKey.get(key)
        if (existing) {
            existing.name ||= invite.candidate_name
            existing.invite = invite
            continue
        }
        if (!interviewById[invite.interview_id]) continue
        byKey.set(key, {
            key,
            interview: interviewById[invite.interview_id],
            name: invite.candidate_name,
            email: invite.candidate_email,
            invite,
            report: null,
            score: null,
            stage: 'assigned',
            date: invite.created_at,
            dueAt: invite.due_at ?? null,
        })
    }

    return [...byKey.values()]
}

// "Front end developer", "front end developer " and "Front End Developer" are the same role.
export function roleKey(jobPosition) {
    return String(jobPosition ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}
