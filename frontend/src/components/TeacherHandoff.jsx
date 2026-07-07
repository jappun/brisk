import { useState } from 'react'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function TeacherHandoff({ onSend, loading, error }) {
  const [teacherEmail, setTeacherEmail] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)

  const emailValid = isValidEmail(teacherEmail)
  const canSend = emailValid && acknowledged && !loading

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-stone-800">
          Thanks for telling me about yourself
        </h1>
        <p className="mt-2 text-stone-500">
          I'll help get this to your teacher.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-amber-100 bg-white p-8 shadow-sm">
        <div>
          <label
            htmlFor="teacher-email"
            className="mb-2 block text-sm font-medium text-stone-700"
          >
            Your teacher's email address
          </label>
          <input
            id="teacher-email"
            type="email"
            value={teacherEmail}
            onChange={(e) => setTeacherEmail(e.target.value)}
            placeholder="teacher@school.edu"
            className="w-full rounded-xl border border-stone-200 bg-amber-50/40 px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          {teacherEmail && !emailValid && (
            <p className="mt-1 text-sm text-red-500">
              Please enter a valid email address.
            </p>
          )}
        </div>

        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <div className="flex gap-3">
            <span className="text-xl" aria-hidden="true">
              ⚠️
            </span>
            <p className="text-sm font-medium leading-relaxed text-amber-900">
              Your teacher will receive a summary{' '}
              <strong>and your full written answers</strong>, exactly as you
              wrote them. Nothing is private from your teacher here.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
          />
          <span className="text-sm text-stone-700">
            I understand my teacher will see my full answers
          </span>
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => onSend(teacherEmail)}
          disabled={!canSend}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </>
          ) : (
            'Send to my teacher'
          )}
        </button>
      </div>
    </div>
  )
}
