import { useState } from 'react'
import { QUESTIONS } from '../api'

export default function ReflectionFlow({ responses, onChange, onComplete }) {
  const [step, setStep] = useState(0)
  const question = QUESTIONS[step]
  const currentAnswer = responses[question.key]
  const canProceed = currentAnswer.trim().length > 0

  function handleNext() {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-amber-700">Student Voice</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-800">
          Tell us about your school experience
        </h1>
        <p className="mt-2 text-stone-500">
          There are no right or wrong answers — just share what feels true for you.
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
          <textarea
            value={currentAnswer}
            onChange={(e) => onChange(question.key, e.target.value)}
            rows={5}
            className="w-full resize-none rounded-xl border border-stone-200 bg-amber-50/40 px-4 py-3 text-stone-800 placeholder:text-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="Type your answer here..."
            autoFocus
          />
        </label>

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
            disabled={!canProceed}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {step < QUESTIONS.length - 1 ? 'Next' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
