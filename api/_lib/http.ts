export class HttpError extends Error {
  status: number
  body: Record<string, unknown>

  constructor(status: number, message: string, extra: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.body = { detail: message, ...extra }
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.')
  }
}

// Wraps a handler so thrown HttpErrors become JSON error responses and
// anything unexpected becomes a logged 500.
export function handle(fn: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await fn(request)
    } catch (error) {
      if (error instanceof HttpError) return json(error.body, error.status)
      console.error(error)
      return json({ detail: 'Something went wrong on our end. Please try again.' }, 500)
    }
  }
}
