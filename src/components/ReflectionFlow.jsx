import { useEffect, useMemo, useState } from 'react'
import { getFollowUp } from '../../lib/questions'
import { validateAnswer } from '../../lib/validation'
import { card, eyebrow, heading, primaryButton, textButton } from './ui'

// Steps are derived from the current answers: a follow-up step appears right
// after its question only while that answer matches the trigger.
function buildSteps(config, answers) {
  const steps = []
  for (const question of config.questions) {
    steps.push({ kind: 'question', question })
    const followUp = getFollowUp(config, question, answers[question.id] ?? '')
    if (followUp) steps.push({ kind: 'followUp', question, text: followUp })
  }
  return steps
}

function firstInvalidStep(steps, answers) {
  return steps.findIndex(
    (s) =>
      s.kind === 'question' &&
      !s.question.optional &&
      validateAnswer(answers[s.question.id] ?? '')
  )
}

export default function ReflectionFlow({
  config,
  answers,
  followUps,
  onAnswer,
  onFollowUp,
  onComplete,
  returnTo = null,
}) {
  const steps = useMemo(() => buildSteps(config, answers), [config, answers])
  const [stepIndex, setStepIndex] = useState(0)
  const [validationError, setValidationError] = useState(null)

  // Coming back from the handoff screen: jump to the flagged question, or the last step.
  useEffect(() => {
    if (!returnTo) return
    const index = returnTo.questionId
      ? steps.findIndex(
          (s) => s.kind === 'question' && s.question.id === returnTo.questionId
        )
      : steps.length - 1
    setStepIndex(Math.max(index, 0))
    setValidationError(returnTo.error)
    // Only react to a new returnTo, not to steps changing as the student types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnTo])

  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const isFollowUp = step.kind === 'followUp'
  const isOptional = isFollowUp || Boolean(step.question.optional)
  const value = (isFollowUp ? followUps : answers)[step.question.id] ?? ''
  const isLast = stepIndex >= steps.length - 1

  const mainQuestions = config.questions.length
  const mainIndex = config.questions.indexOf(step.question)

  function handleChange(text) {
    setValidationError(null)
    if (isFollowUp) onFollowUp(step.question.id, text)
    else onAnswer(step.question.id, text)
  }

  function goTo(index) {
    setStepIndex(index)
    setValidationError(null)
  }

  function handleNext() {
    if (!isOptional) {
      const error = validateAnswer(value)
      if (error) {
        setValidationError(error)
        return
      }
    }
    if (!isLast) {
      goTo(stepIndex + 1)
      return
    }
    const invalid = firstInvalidStep(steps, answers)
    if (invalid >= 0) {
      setStepIndex(invalid)
      setValidationError(validateAnswer(answers[steps[invalid].question.id] ?? ''))
      return
    }
    onComplete()
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <p className={eyebrow}>IEP Intake Companion</p>
        <h1 className={`mt-2 ${heading}`}>Tell me about school</h1>
      </div>

      <div className={card}>
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted">
            {mainIndex + 1} of {mainQuestions}
          </span>
          <div className="flex gap-1">
            {config.questions.map((q, i) => (
              <div
                key={q.id}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i <= mainIndex ? 'bg-ink' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        <label className="block">
          {isFollowUp && (
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-accent">
              One more thing
            </span>
          )}
          <span className="mb-3 block text-lg leading-relaxed">
            {isFollowUp ? step.text : step.question.text}
          </span>
          {isOptional && (
            <span className="mb-2 block text-sm text-muted">
              Totally optional — skip it if you like.
            </span>
          )}
          <textarea
            key={`${step.kind}-${step.question.id}`}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            rows={5}
            className={`w-full resize-none rounded-lg border px-4 py-3 text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200'
                : 'border-neutral-300 focus:border-accent focus:ring-accent/20'
            }`}
            placeholder="Type here..."
            autoFocus
          />
        </label>

        {validationError && <p className="mt-3 text-sm text-red-600">{validationError}</p>}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => goTo(stepIndex - 1)}
            disabled={stepIndex === 0}
            className={textButton}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!isOptional && !value.trim()}
            className={primaryButton}
          >
            {isLast ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
