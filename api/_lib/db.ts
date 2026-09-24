import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { QuestionConfig } from '../../lib/questions.js'
import { HttpError } from './http.js'

export const LINK_TTL_DAYS = 7

export type IntakeLink = {
  id: string
  teacher_email: string
  student_email: string
  question_config: QuestionConfig
  created_at: string
  expires_at: string
  used_at: string | null
}

export type LinkStatus = 'valid' | 'not_found' | 'expired' | 'used'

let client: SupabaseClient | null = null

function db(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!url || !key) {
    throw new HttpError(500, 'SUPABASE_URL and SUPABASE_SECRET_KEY must be set.')
  }
  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Buffer.from(bytes).toString('base64url')
}

export async function createLink(input: {
  teacherEmail: string
  studentEmail: string
  config: QuestionConfig
}): Promise<IntakeLink> {
  const now = new Date()
  const expires = new Date(now.getTime() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000)
  const { data, error } = await db()
    .from('intake_links')
    .insert({
      id: newToken(),
      teacher_email: input.teacherEmail,
      student_email: input.studentEmail,
      question_config: input.config,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .select()
    .single()
  if (error) throw dbError(error)
  return data as IntakeLink
}

export async function deleteLink(token: string): Promise<void> {
  const { error } = await db().from('intake_links').delete().eq('id', token)
  if (error) console.error('Failed to delete link', error)
}

export async function getLink(
  token: string
): Promise<{ status: LinkStatus; link: IntakeLink | null }> {
  const { data, error } = await db()
    .from('intake_links')
    .select()
    .eq('id', token)
    .maybeSingle()
  if (error) throw dbError(error)
  const link = data as IntakeLink | null
  if (!link) return { status: 'not_found', link: null }
  if (link.used_at) return { status: 'used', link }
  if (new Date(link.expires_at).getTime() <= Date.now()) return { status: 'expired', link }
  return { status: 'valid', link }
}

// Atomically marks the link used. Returns null if another request already
// claimed it or it expired, so a double-submit can't send two emails.
export async function claimLink(token: string): Promise<IntakeLink | null> {
  const now = new Date().toISOString()
  const { data, error } = await db()
    .from('intake_links')
    .update({ used_at: now })
    .eq('id', token)
    .is('used_at', null)
    .gt('expires_at', now)
    .select()
    .maybeSingle()
  if (error) throw dbError(error)
  return data as IntakeLink | null
}

// Undoes a claim when delivery fails, so the student can try again.
export async function releaseLink(token: string): Promise<void> {
  const { error } = await db()
    .from('intake_links')
    .update({ used_at: null })
    .eq('id', token)
  if (error) console.error('Failed to release link', error)
}

function dbError(error: { message: string }): HttpError {
  console.error('Supabase error', error)
  // Surface the real cause locally; keep production messages generic.
  const detail = process.env.NODE_ENV === 'production' ? '' : ` (${error.message})`
  return new HttpError(500, `Could not reach the database. Please try again.${detail}`)
}
