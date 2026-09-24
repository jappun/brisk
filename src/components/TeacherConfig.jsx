import { useState } from 'react'
import {
  ADAPTIVE_TRIGGERS,
  DEFAULT_QUESTIONS,
  MAX_CUSTOM_QUESTION_LENGTH,
  MAX_CUSTOM_QUESTIONS,
} from '../../lib/questions'
import { createLink } from '../api'
import {
  card,
  errorBox,
  eyebrow,
  heading,
  input,
  primaryButton,
  secondaryButton,
  Spinner,
} from './ui'

const ALL_DEFAULT_IDS = DEFAULT_QUESTIONS.map((q) => q.id)
// Rendered in the order the student sees them: custom questions go between these.
const MAIN_DEFAULTS = DEFAULT_QUESTIONS.filter((q) => !q.optional)
const CLOSING_DEFAULTS = DEFAULT_QUESTIONS.filter((q) => q.optional)

export default function TeacherConfig() {
  const [enabled, setEnabled] = useState(() => new Set(ALL_DEFAULT_IDS))
  const [adaptive, setAdaptive] = useState(true)
  const [customQuestions, setCustomQuestions] = useState([])
  const [draft, setDraft] = useState('')
  const [teacherEmail, setTeacherEmail] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const pendingCustom = draft.trim()
  const allCustom = pendingCustom ? [...customQuestions, pendingCustom] : customQuestions
  const questionCount = enabled.size + allCustom.length
  const canAddCustom = pendingCustom && customQuestions.length < MAX_CUSTOM_QUESTIONS
  const canSubmit =
    !loading && questionCount > 0 && teacherEmail.trim() && studentEmail.trim()

  function toggleQuestion(id) {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addCustom() {
    if (!canAddCustom) return
    setCustomQuestions((prev) => [...prev, pendingCustom])
    setDraft('')
  }

  function removeCustom(index) {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await createLink({
        teacherEmail: teacherEmail.trim(),
        studentEmail: studentEmail.trim(),
        enabledDefaults: ALL_DEFAULT_IDS.filter((id) => enabled.has(id)),
        customQuestions: allCustom.slice(0, MAX_CUSTOM_QUESTIONS),
        adaptive,
      })
      setCustomQuestions(allCustom.slice(0, MAX_CUSTOM_QUESTIONS))
      setDraft('')
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSendAnother() {
    setResult(null)
    setStudentEmail('')
  }

  if (result) {
    return <LinkSent result={result} onSendAnother={handleSendAnother} />
  }

  function renderDefault(q) {
    const followUp = adaptive && ADAPTIVE_TRIGGERS[q.id]
    return (
      <li key={q.id}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={enabled.has(q.id)}
            onChange={() => toggleQuestion(q.id)}
            className="mt-1 h-4 w-4 shrink-0 accent-accent"
          />
          <span className="text-sm leading-relaxed">
            {q.text}
            {q.optional && <span className="ml-2 text-xs text-muted">(optional)</span>}
          </span>
        </label>
        {followUp && enabled.has(q.id) && (
          <p className="mt-1.5 ml-7 border-l-2 border-accent/40 pl-3 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-accent">{followUp.when}:</span>{' '}
            &ldquo;{followUp.followUp}&rdquo;
          </p>
        )}
      </li>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className={eyebrow}>IEP Intake Companion</p>
        <h1 className={`mt-2 ${heading}`}>Hear from your student</h1>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <h2 className="text-lg font-bold">Questions</h2>
            <div className="flex items-center gap-2.5">
              <span id="adaptive-label" className="text-sm text-muted">
                Adaptive follow-ups
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={adaptive}
                aria-labelledby="adaptive-label"
                onClick={() => setAdaptive(!adaptive)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                  adaptive ? 'bg-accent' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    adaptive ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <ul className="mt-5 space-y-4">
            {MAIN_DEFAULTS.map(renderDefault)}

            {customQuestions.map((text, i) => (
              <li
                key={`custom-${i}`}
                className="flex items-start justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="leading-relaxed">{text}</span>
                <button
                  type="button"
                  onClick={() => removeCustom(i)}
                  className="shrink-0 text-xs font-medium text-muted hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}

            {customQuestions.length < MAX_CUSTOM_QUESTIONS && (
              <li className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  maxLength={MAX_CUSTOM_QUESTION_LENGTH}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustom()
                    }
                  }}
                  placeholder="Add your own question"
                  className={input}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!canAddCustom}
                  className={`${secondaryButton} shrink-0`}
                >
                  Add
                </button>
              </li>
            )}

            {CLOSING_DEFAULTS.map(renderDefault)}
          </ul>
        </section>

        <section className={`${card} space-y-4`}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Your email</span>
            <input
              type="email"
              required
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="you@school.org"
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Student&apos;s email</span>
            <input
              type="email"
              required
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@school.org"
              className={input}
            />
          </label>
        </section>

        {error && <div className={errorBox}>{error}</div>}

        <div>
          <button type="submit" disabled={!canSubmit} className={`${primaryButton} w-full`}>
            {loading ? (
              <>
                <Spinner />
                Sending...
              </>
            ) : (
              'Send link'
            )}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            One-time link, good for 7 days.
          </p>
        </div>
      </div>
    </form>
  )
}

function LinkSent({ result, onSendAnother }) {
  const [copied, setCopied] = useState(false)
  const expires = new Date(result.expiresAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  async function copy() {
    await navigator.clipboard.writeText(result.link)
    setCopied(true)
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className={`${card} text-center`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white">
          ✓
        </div>
        <h1 className={heading}>Sent!</h1>
        <p className="mt-3 text-muted">
          <span className="font-semibold text-ink">{result.studentEmail}</span> has their
          link. It&apos;s good until {expires}.
        </p>
        <button type="button" onClick={onSendAnother} className={`${primaryButton} mt-8 w-full`}>
          Send another
        </button>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-neutral-300 p-5 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">For demo users</p>
        <p className="text-sm text-muted">
          Didn&apos;t get the email? Check your spam folder. Or open the link directly:
        </p>
        <div className="flex items-center gap-2">
          <a
            href={result.link}
            className="min-w-0 flex-1 truncate text-sm text-accent underline underline-offset-2"
          >
            {result.link}
          </a>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 text-sm font-medium text-muted hover:text-ink"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
