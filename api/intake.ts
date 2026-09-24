import { z } from 'zod'
import { getFollowUp, type QuestionConfig } from '../lib/questions.js'
import { validateAnswer } from '../lib/validation.js'
import { claimLink, getLink, releaseLink, type LinkStatus } from './_lib/db.js'
import {
  sendEmail,
  studentConfirmationEmail,
  teacherSummaryEmail,
} from './_lib/email.js'
import { handle, HttpError, json, readJson } from './_lib/http.js'
import { summarizeTranscript, type TranscriptEntry } from './_lib/summarize.js'

const INVALID_MESSAGES: Record<Exclude<LinkStatus, 'valid'>, string> = {
  not_found: "Hmm, this link doesn't work. Ask your teacher for a new one.",
  expired: 'This link has expired. Ask your teacher for a new one.',
  used: "You've already sent your answers. Thanks!",
}

async function requireValidLink(token: string) {
  const { status, link } = await getLink(token)
  if (status !== 'valid' || !link) {
    throw new HttpError(410, INVALID_MESSAGES[status as Exclude<LinkStatus, 'valid'>], {
      reason: status,
    })
  }
  return link
}

export const GET = handle(async (request) => {
  const token = new URL(request.url).searchParams.get('token')?.trim()
  if (!token) throw new HttpError(400, 'Missing link token.')

  const link = await requireValidLink(token)
  return json({
    teacherEmail: link.teacher_email,
    expiresAt: link.expires_at,
    config: link.question_config,
  })
})

const SubmitSchema = z.object({
  token: z.string().min(1),
  answers: z.record(z.string(), z.string().max(5000)),
  followUps: z.record(z.string(), z.string().max(5000)).default({}),
})

// Builds the transcript from the config stored with the link, so question
// wording (and which follow-ups apply) comes from the server, not the client.
function buildTranscript(
  config: QuestionConfig,
  answers: Record<string, string>,
  followUps: Record<string, string>
): TranscriptEntry[] {
  const transcript: TranscriptEntry[] = []
  for (const question of config.questions) {
    const answer = answers[question.id] ?? ''
    if (!question.optional) {
      const error = validateAnswer(answer)
      if (error) throw new HttpError(400, error, { questionId: question.id })
    }
    transcript.push({ question: question.text, answer })

    const followUp = getFollowUp(config, question, answer)
    if (followUp) {
      transcript.push({ question: followUp, answer: followUps[question.id] ?? '', followUp: true })
    }
  }
  return transcript
}

export const POST = handle(async (request) => {
  const parsed = SubmitSchema.safeParse(await readJson(request))
  if (!parsed.success) throw new HttpError(400, 'Invalid submission.')
  const { token, answers, followUps } = parsed.data

  const link = await requireValidLink(token)
  const transcript = buildTranscript(link.question_config, answers, followUps)

  if (!(await claimLink(token))) {
    await requireValidLink(token) // throws the right 410 (used/expired)
    throw new HttpError(409, 'This link could not be claimed. Please try again.')
  }

  try {
    const { summary, flaggedForReview } = await summarizeTranscript(transcript)
    await sendEmail(
      teacherSummaryEmail({
        to: link.teacher_email,
        studentEmail: link.student_email,
        summary,
        flaggedForReview,
        transcript,
      })
    )
  } catch (error) {
    // Nothing reached the teacher, so let the student retry with the same link.
    await releaseLink(token)
    throw error
  }

  try {
    await sendEmail(studentConfirmationEmail(link.student_email))
  } catch (error) {
    console.error('Student confirmation email failed', error)
  }

  return json({ status: 'sent', teacherEmail: link.teacher_email })
})
