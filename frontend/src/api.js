export const QUESTIONS = [
  {
    key: 'proud_moment',
    text: "What's something you've felt proud of recently?",
  },
  {
    key: 'challenge',
    text: "What's something that's hard for you, and when does it usually show up? (a specific class, a type of task, a time of day, etc.)",
  },
  {
    key: 'helped',
    text: 'Has a teacher ever done something that actually helped? What was it?',
  },
  {
    key: 'didnt_help',
    text: "Has anything made things worse, or not helped even if it was meant to?",
  },
  {
    key: 'wish_changed',
    text: 'If you could change one thing about how school works for you, what would it be?',
  },
  {
    key: 'anything_else',
    text: 'Is there anything else you want your teacher to know?',
  },
]

export const EMPTY_RESPONSES = Object.fromEntries(
  QUESTIONS.map((q) => [q.key, ''])
)

async function parseError(res, fallback) {
  const err = await res.json().catch(() => ({}))
  const detail = err.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
  return fallback
}

export async function synthesize(responses) {
  const res = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to generate summary'))
  }
  return res.json()
}

export async function sendSummary(teacherEmail, responses, summary) {
  const res = await fetch('/api/send-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teacher_email: teacherEmail,
      responses,
      summary,
    }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res, 'Failed to send summary'))
  }
  return res.json()
}
