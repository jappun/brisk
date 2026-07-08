import { useEffect, useState } from 'react'
import { QUESTIONS } from '../api'
import { validateAnswer, validateAllResponses } from '../validateAnswer'

function canProceedWithAnswer(answer, optional) {
  const trimmed = answer.trim()
  if (optional && trimmed === '') return true
  return validateAnswer(answer) === null
}

export default function ReflectionFlow({
  responses,
  onChange,
  onComplete,
  initialStep = 0,
  externalError = null,
}) {
  const [step, setStep] = useState(initialStep)
  const [validationError, setValidationError] = useState(null)
  const question = QUESTIONS[step]
  const currentAnswer = responses[question.key]
  const isOptional = Boolean(question.optional)
  const trimmed = currentAnswer.trim()
  const canClickNext = isOptional || trimmed.length > 0

  useEffect(() => {
    setStep(initialStep)
    setValidationError(null)
  }, [initialStep])

  useEffect(() => {
    if (externalError) {
      setValidationError(externalError)
    }
  }, [externalError])

  function handleChange(key, value) {
    setValidationError(null)
    onChange(key, value)
  }

  function handleNext() {
    if (!canProceedWithAnswer(currentAnswer, isOptional)) {
      setValidationError(
        validateAnswer(currentAnswer) ||
          'Please write a real answer your teacher can understand.'
      )
      return
    }

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
      setValidationError(null)
      return
    }

    const invalid = validateAllResponses(responses, QUESTIONS)
    if (invalid) {
      const invalidStep = QUESTIONS.findIndex((q) => q.key === invalid.key)
      setStep(invalidStep >= 0 ? invalidStep : 0)
      setValidationError(invalid.error)
      return
    }

    onComplete()
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1)
      setValidationError(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-amber-700">IEP Intake Companion</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-800">
          Tell me about your school experience
        </h1>
        <p className="mt-2 text-stone-500">
          There are no right or wrong answers, just share what feels true for you.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-600">
            {step + 1} of {QUESTIONS.length}
          </span>
          <div className="flex gap-1">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i <= step ? 'bg-amber-400' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-3 block text-lg leading-relaxed text-stone-700">
            {question.text}
          </span>
          {isOptional && (
            <span className="mb-2 block text-sm text-stone-500">
              Optional — you can leave this blank.
            </span>
          )}
          <textarea
            value={currentAnswer}
            onChange={(e) => handleChange(question.key, e.target.value)}
            rows={5}
            className={`w-full resize-none rounded-xl border px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200'
                : 'border-stone-200 bg-amber-50/40 focus:border-amber-300 focus:ring-amber-200'
            }`}
            placeholder="Type your answer here..."
            autoFocus
          />
        </label>

        {validationError && (
          <p className="mt-3 text-sm text-red-600">{validationError}</p>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-500 transition hover:text-stone-700 disabled:invisible"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canClickNext}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {step < QUESTIONS.length - 1 ? 'Next' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
