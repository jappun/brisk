export class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request(path, options, fallback) {
  // The API is served from the same origin (Vercel functions / Vite dev server).
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(
      typeof body.detail === 'string' ? body.detail : fallback,
      res.status,
      body
    )
  }
  return body
}

export function createLink(payload) {
  return request(
    '/api/links',
    { method: 'POST', body: JSON.stringify(payload) },
    'Failed to create the link'
  )
}

export function getIntake(token) {
  return request(
    `/api/intake?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
    'Could not load this link'
  )
}

export function submitIntake(token, answers, followUps) {
  return request(
    '/api/intake',
    { method: 'POST', body: JSON.stringify({ token, answers, followUps }) },
    'Failed to send your answers'
  )
}
