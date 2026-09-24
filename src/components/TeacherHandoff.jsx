import { useState } from 'react'
import { card, errorBox, heading, primaryButton, secondaryButton, Spinner } from './ui'

export default function TeacherHandoff({
  teacherEmail,
  onSend,
  onBack,
  loading,
  error,
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const canSend = acknowledged && !loading

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <h1 className={heading}>Thanks for sharing!</h1>
      </div>

      <div className={`${card} space-y-6`}>
        <p className="leading-relaxed">
          Your teacher (<span className="font-semibold">{teacherEmail}</span>) will get
          a short summary <strong>and your answers exactly as you wrote them</strong>.
        </p>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 accent-accent"
          />
          <span className="text-sm">Got it, my teacher will see what I wrote</span>
        </label>

        {error && <div className={errorBox}>{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={onBack} disabled={loading} className={secondaryButton}>
            Back
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={`${primaryButton} flex-1`}
          >
            {loading ? (
              <>
                <Spinner />
                Sending...
              </>
            ) : (
              'Send to my teacher'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
