import { Resend } from 'resend'
import { HttpError } from './http.js'
import type { IntakeSummary, TranscriptEntry } from './summarize.js'

const CONTACT_EMAIL = 'jappun.dev@gmail.com'
const DEFAULT_FROM = 'IEP Intake Companion <noreply@jappundhillon.com>'
const ACCENT = '#296C81'

type Email = { to: string; subject: string; html: string; text: string }

export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) throw new HttpError(500, 'RESEND_API_KEY is not set.')
  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
  if (error) {
    console.error('Resend error', error)
    throw new HttpError(502, `Failed to send email to ${email.to}.`)
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const CONTACT_TEXT = `This inbox doesn't accept replies. Questions? Contact ${CONTACT_EMAIL}.`

function layout(body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#ffffff;font-family:'DM Sans',Arial,sans-serif;color:#0e161c;line-height:1.5">
<div style="max-width:600px;margin:0 auto">
${body}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px">
<p style="font-size:13px;color:#565b61;margin:0">This inbox doesn't accept replies. Questions? Contact <a href="mailto:${CONTACT_EMAIL}" style="color:${ACCENT}">${CONTACT_EMAIL}</a>.</p>
</div></body></html>`
}

export function studentInviteEmail(opts: {
  to: string
  teacherEmail: string
  link: string
  expiresAt: string
}): Email {
  const expires = formatDate(opts.expiresAt)
  return {
    to: opts.to,
    subject: 'Your teacher wants to hear from you',
    text: [
      'Hi!',
      '',
      `Your teacher (${opts.teacherEmail}) wants to hear how school's going for you. It's just a few quick questions — no wrong answers.`,
      '',
      `Start here: ${opts.link}`,
      '',
      `The link works until ${expires}.`,
      '',
      CONTACT_TEXT,
    ].join('\n'),
    html: layout(`
<h1 style="font-size:22px;margin:0 0 16px">Hi! Your teacher wants to hear from you</h1>
<p>Your teacher (<strong>${escapeHtml(opts.teacherEmail)}</strong>) wants to hear how school's going for you. It's just a few quick questions — no wrong answers.</p>
<p style="margin:28px 0"><a href="${escapeHtml(opts.link)}" style="background:${ACCENT};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Let's go</a></p>
<p style="font-size:14px;color:#565b61">The link works until ${expires}.</p>`),
  }
}

export function studentConfirmationEmail(to: string): Email {
  return {
    to,
    subject: 'Thanks for sharing!',
    text: [
      'Hi!',
      '',
      'Your answers made it to your teacher. Thanks for being so honest.',
      '',
      CONTACT_TEXT,
    ].join('\n'),
    html: layout(`
<h1 style="font-size:22px;margin:0 0 16px">Thanks for sharing!</h1>
<p>Your answers made it to your teacher. Thanks for being so honest.</p>`),
  }
}

const SUMMARY_SECTIONS: { key: keyof IntakeSummary; label: string }[] = [
  { key: 'strengths', label: 'Strengths' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'studentStatedPreferences', label: 'What the student says works for them' },
  { key: 'suggestedAccommodations', label: 'Accommodations to consider' },
]

export function teacherSummaryEmail(opts: {
  to: string
  studentEmail: string
  summary: IntakeSummary | null
  flaggedForReview: boolean
  transcript: TranscriptEntry[]
}): Email {
  const { summary, flaggedForReview, transcript } = opts

  const reviewNote = summary
    ? 'The AI summary below may be unreliable (short, unclear, or ambiguous answers). Please read the full transcript before using it.'
    : "We couldn't generate a reliable summary this time. Their full answers are below."

  // Plain-text version
  const text: string[] = [
    'Hello,',
    '',
    `${opts.studentEmail} finished their reflection. Here's what they shared.`,
    '',
  ]
  if (flaggedForReview) text.push(`⚠ NEEDS TEACHER REVIEW: ${reviewNote}`, '')
  if (summary) {
    text.push('── SUMMARY ──', summary.summary, '')
    for (const { key, label } of SUMMARY_SECTIONS) {
      const items = summary[key] as string[]
      text.push(`${label}:`)
      text.push(...(items.length ? items.map((i) => `- ${i}`) : ['- (none mentioned)']))
      text.push('')
    }
  }
  text.push("── STUDENT'S OWN WORDS (full transcript) ──", '')
  for (const entry of transcript) {
    text.push(`${entry.followUp ? 'Follow-up' : 'Q'}: ${entry.question}`)
    text.push(`A: ${entry.answer.trim() || '(no response)'}`, '')
  }
  text.push(CONTACT_TEXT)

  // HTML version
  const reviewBanner = flaggedForReview
    ? `<div style="border:2px solid #b45309;background:#fffbeb;border-radius:8px;padding:12px 16px;margin:0 0 24px"><strong style="color:#92400e">Needs teacher review.</strong> <span style="color:#78350f">${escapeHtml(reviewNote)}</span></div>`
    : ''

  const summaryHtml = summary
    ? `<h2 style="font-size:17px;margin:24px 0 8px">Summary</h2>
<p style="margin:0 0 16px">${escapeHtml(summary.summary)}</p>
${SUMMARY_SECTIONS.map(({ key, label }) => {
  const items = summary[key] as string[]
  const list = items.length
    ? `<ul style="margin:4px 0 16px;padding-left:20px">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
    : '<p style="margin:4px 0 16px;color:#565b61">(none mentioned)</p>'
  return `<h3 style="font-size:15px;margin:0">${label}</h3>${list}`
}).join('\n')}`
    : ''

  const transcriptHtml = transcript
    .map(
      (entry) => `<div style="margin:0 0 16px${entry.followUp ? `;padding-left:16px;border-left:3px solid ${ACCENT}` : ''}">
<p style="margin:0;font-weight:600">${entry.followUp ? 'Follow-up: ' : ''}${escapeHtml(entry.question)}</p>
<p style="margin:4px 0 0;white-space:pre-wrap">${escapeHtml(entry.answer.trim() || '(no response)')}</p></div>`
    )
    .join('\n')

  return {
    to: opts.to,
    subject: `${flaggedForReview ? '[Needs review] ' : ''}Student reflection from ${opts.studentEmail}`,
    text: text.join('\n'),
    html: layout(`
<h1 style="font-size:22px;margin:0 0 8px">Student reflection summary</h1>
<p style="margin:0 0 24px;color:#565b61"><strong style="color:#0e161c">${escapeHtml(opts.studentEmail)}</strong> finished their reflection. Here's what they shared.</p>
${reviewBanner}
${summaryHtml}
<h2 style="font-size:17px;margin:32px 0 12px;padding-top:16px;border-top:1px solid #e5e5e5">Student's own words (full transcript)</h2>
${transcriptHtml}`),
  }
}
