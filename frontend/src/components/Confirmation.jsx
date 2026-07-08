import { useState } from 'react'
import { QUESTIONS } from '../api'

const SUMMARY_SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'what_worked', label: 'What Has Worked' },
  { key: 'student_goals', label: 'Student Goals & Wishes' },
]

export default function Confirmation({ teacherEmail, responses, summary }) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold text-stone-800">All done!</h1>
        <p className="mt-2 text-stone-600">
          Sent to{' '}
          <span className="font-medium text-stone-800">{teacherEmail}</span>
        </p>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="mt-6 text-sm font-medium text-amber-600 underline decoration-amber-300 underline-offset-2 transition hover:text-amber-700"
        >
          {showPreview ? 'Hide what was sent' : 'For demo only (not visible to student): See what was sent'}
        </button>
      </div>

      {showPreview && (
        <div className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-6 text-left text-sm text-stone-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Email preview
          </p>

          {SUMMARY_SECTIONS.map(({ key, label }) => (
            <div key={key}>
              <h3 className="font-semibold text-stone-800">{label}</h3>
              <p className="mt-1 leading-relaxed">{summary[key]}</p>
            </div>
          ))}

          <div className="border-t border-stone-200 pt-4">
            <h3 className="font-semibold text-stone-800">
              Student&apos;s Own Words (full transcript)
            </h3>
            <div className="mt-3 space-y-4">
              {QUESTIONS.map((q) => (
                <div key={q.key}>
                  <p className="font-medium text-stone-600">Q: {q.text}</p>
                  <p className="mt-1 leading-relaxed">
                    A: {responses[q.key] || '(no response)'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
