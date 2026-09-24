import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  APICallError,
  generateText,
  NoObjectGeneratedError,
  Output,
  RetryError,
} from 'ai'
import { z } from 'zod'
import { HttpError } from './http.js'

export type TranscriptEntry = {
  question: string
  answer: string
  followUp?: boolean
}

export const IntakeSummarySchema = z.object({
  strengths: z
    .array(z.string())
    .describe('What the student does well or feels proud of, in their terms.'),
  challenges: z
    .array(z.string())
    .describe('What feels hard for the student and when it shows up.'),
  studentStatedPreferences: z
    .array(z.string())
    .describe(
      'Conditions, teacher behaviors, or supports the student says they like or want.'
    ),
  suggestedAccommodations: z
    .array(z.string())
    .describe(
      'Classroom supports worth discussing, each grounded in something the student said.'
    ),
  summary: z
    .string()
    .describe(
      '2-3 sentence teacher-facing overview carrying the single most useful takeaway.'
    ),
  flaggedForReview: z
    .boolean()
    .describe(
      'True if the answers are too short, off-topic, contradictory, or ambiguous to summarize with confidence.'
    ),
})

export type IntakeSummary = z.infer<typeof IntakeSummarySchema>

export type SummaryResult = {
  summary: IntakeSummary | null
  flaggedForReview: boolean
}

// Schema-failure attempts. Output.object() already constrains Gemini to the
// schema, so remaining failures are things like truncation or an empty
// response — a plain retry is the right fix, not a different prompt.
const MAX_SCHEMA_ATTEMPTS = 2

const SYSTEM_PROMPT = `You are a synthesis assistant for a student reflection tool used before IEP meetings. Teachers use your output as student-voice input alongside Brisk's IEP Goal Generator.

Your job is to turn a student's own written answers into a brief, teacher-ready summary. You are NOT writing an IEP, NOT diagnosing, and NOT making eligibility claims.

STRICT RULES:
- Never diagnose, name, or imply any disability category or condition.
- Never use clinical or deficit-framed language (e.g. "deficit," "disorder," "symptoms").
- Never invent details not present in the student's responses.
- Write in a warm but professional register suitable for a teacher preparing for an IEP meeting.
- Ground every item in what the student actually said. Keep each list item to one short sentence.
- Lists may be empty if the student said nothing relevant.
- Suggested accommodations are ideas for the teacher to consider, not recommendations or requirements.
- Set flaggedForReview to true if the answers are too thin, off-topic, or ambiguous to summarize with confidence.
- Write the summary field last, after considering everything else.`

function buildPrompt(transcript: TranscriptEntry[]): string {
  const lines = transcript.map((entry) => {
    const label = entry.followUp ? 'Follow-up question' : 'Question'
    const answer = entry.answer.trim() || '(no response)'
    return `${label}: ${entry.question}\nStudent answer: ${answer}`
  })
  return `Summarize the following student reflection.\n\n${lines.join('\n\n')}`
}

function getModels(): string[] {
  const primary = (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite').trim()
  const fallbacks = (
    process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash,gemini-2.0-flash-lite'
  )
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m && m !== primary)
  return [primary, ...fallbacks]
}

function statusOf(error: unknown): number | undefined {
  if (RetryError.isInstance(error)) return statusOf(error.lastError)
  if (APICallError.isInstance(error)) return error.statusCode
  return undefined
}

// Calls the model, moving to the next fallback model when one is overloaded.
// The AI SDK already retries transient errors with backoff (maxRetries) before
// throwing, so a thrown 5xx here means that model is exhausted.
async function generateWithFallback(prompt: string): Promise<IntakeSummary> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new HttpError(500, 'GEMINI_API_KEY is not set.')
  }
  const google = createGoogleGenerativeAI({ apiKey })

  let lastError: unknown
  for (const model of getModels()) {
    try {
      const { output } = await generateText({
        model: google(model),
        output: Output.object({ schema: IntakeSummarySchema }),
        system: SYSTEM_PROMPT,
        prompt,
      })
      return output
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) throw error
      const status = statusOf(error)
      if (status === 429) {
        throw new HttpError(
          429,
          'The AI model is rate limited right now. Please wait a minute and try again.'
        )
      }
      if (status !== undefined && status >= 500) {
        lastError = error
        continue
      }
      throw error
    }
  }
  console.error('All Gemini models unavailable', lastError)
  throw new HttpError(
    503,
    'The AI model is temporarily overloaded. Please wait a few seconds and try again.'
  )
}

export async function summarizeTranscript(
  transcript: TranscriptEntry[]
): Promise<SummaryResult> {
  const prompt = buildPrompt(transcript)

  for (let attempt = 1; attempt <= MAX_SCHEMA_ATTEMPTS; attempt++) {
    try {
      const summary = await generateWithFallback(prompt)
      return { summary, flaggedForReview: summary.flaggedForReview }
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error
      console.warn(`Schema mismatch on attempt ${attempt}`, error.finishReason, error.text)
    }
  }

  // Repeated schema failures: still deliver the transcript, but mark it for
  // review rather than sending a malformed summary.
  return { summary: null, flaggedForReview: true }
}
