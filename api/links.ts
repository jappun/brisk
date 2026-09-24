import { z } from 'zod'
import {
  DEFAULT_QUESTIONS,
  MAX_CUSTOM_QUESTION_LENGTH,
  MAX_CUSTOM_QUESTIONS,
  orderQuestions,
  type Question,
  type QuestionConfig,
} from '../lib/questions.js'
import { createLink, deleteLink } from './_lib/db.js'
import { sendEmail, studentInviteEmail } from './_lib/email.js'
import { handle, HttpError, json, readJson } from './_lib/http.js'

const DEFAULT_IDS = DEFAULT_QUESTIONS.map((q) => q.id) as [string, ...string[]]

const CreateLinkSchema = z.object({
  teacherEmail: z.email('Enter a valid teacher email.'),
  studentEmail: z.email('Enter a valid student email.'),
  enabledDefaults: z.array(z.enum(DEFAULT_IDS)),
  customQuestions: z
    .array(z.string().trim().min(1).max(MAX_CUSTOM_QUESTION_LENGTH))
    .max(MAX_CUSTOM_QUESTIONS),
  adaptive: z.boolean(),
})

function buildConfig(input: z.infer<typeof CreateLinkSchema>): QuestionConfig {
  const enabled = new Set(input.enabledDefaults)
  const custom: Question[] = input.customQuestions.map((text, i) => ({
    id: `custom_${i + 1}`,
    text,
    custom: true,
  }))
  const questions = orderQuestions(
    DEFAULT_QUESTIONS.filter((q) => enabled.has(q.id)),
    custom
  )
  return { adaptive: input.adaptive, questions }
}

function appUrl(request: Request): string {
  const configured = process.env.APP_URL?.trim()
  return (configured || new URL(request.url).origin).replace(/\/$/, '')
}

export const POST = handle(async (request) => {
  const parsed = CreateLinkSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid request.')
  }
  const config = buildConfig(parsed.data)
  if (config.questions.length === 0) {
    throw new HttpError(400, 'Choose at least one question for the student.')
  }

  const link = await createLink({
    teacherEmail: parsed.data.teacherEmail,
    studentEmail: parsed.data.studentEmail,
    config,
  })
  const url = `${appUrl(request)}/intake/${link.id}`

  try {
    await sendEmail(
      studentInviteEmail({
        to: link.student_email,
        teacherEmail: link.teacher_email,
        link: url,
        expiresAt: link.expires_at,
      })
    )
  } catch (error) {
    // Don't leave an orphaned link the student never received.
    await deleteLink(link.id)
    throw error
  }

  return json({ link: url, studentEmail: link.student_email, expiresAt: link.expires_at }, 201)
})
