// Helpers for reading AI feedback stored in the "interview feedback" table.

// Average of the numeric ratings (out of 10), rounded to one decimal; null if none.
export function overallScore(feedbackRow) {
  const rating = feedbackRow?.feedback?.rating
  if (!rating || typeof rating !== 'object') return null

  const values = Object.values(rating).map(Number).filter((value) => Number.isFinite(value))
  if (!values.length) return null

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export function averageScore(feedbackRows) {
  const scores = feedbackRows.map(overallScore).filter((score) => score !== null)
  if (!scores.length) return null
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
}

export function isRecommended(feedbackRow) {
  if (typeof feedbackRow?.recommended === 'boolean') return feedbackRow.recommended
  return String(feedbackRow?.feedback?.recommendation ?? '').toLowerCase() === 'recommended'
}
