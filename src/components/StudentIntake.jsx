import { useEffect, useState } from 'react'
import { getIntake, submitIntake } from '../api'
import Confirmation from './Confirmation'
import HomeScreen from './HomeScreen'
import ReflectionFlow from './ReflectionFlow'
import TeacherHandoff from './TeacherHandoff'
import { card, errorBox, heading, primaryButton } from './ui'

const SCREENS = {
  LOADING: 'loading',
  INVALID: 'invalid',
  LOAD_ERROR: 'load_error',
  HOME: 'home',
  REFLECTION: 'reflection',
  HANDOFF: 'handoff',
  CONFIRMATION: 'confirmation',
}

export default function StudentIntake({ token }) {
  const [screen, setScreen] = useState(SCREENS.LOADING)
  const [intake, setIntake] = useState(null)
  const [message, setMessage] = useState(null)
  const [invalidReason, setInvalidReason] = useState(null)
  const [answers, setAnswers] = useState({})
  const [followUps, setFollowUps] = useState({})
  const [returnTo, setReturnTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function load() {
    setScreen(SCREENS.LOADING)
    getIntake(token)
      .then((data) => {
        setIntake(data)
        setScreen(SCREENS.HOME)
      })
      .catch((err) => {
        setMessage(err.message)
        setInvalidReason(err.body?.reason)
        setScreen(err.status === 410 ? SCREENS.INVALID : SCREENS.LOAD_ERROR)
      })
  }

  useEffect(load, [token])

  function handleBackToReflection() {
    setError(null)
    setReturnTo({ questionId: null, error: null })
    setScreen(SCREENS.REFLECTION)
  }

  async function handleSend() {
    setLoading(true)
    setError(null)
    try {
      await submitIntake(token, answers, followUps)
      setScreen(SCREENS.CONFIRMATION)
    } catch (err) {
      if (err.status === 410) {
        setMessage(err.message)
        setInvalidReason(err.body?.reason)
        setScreen(SCREENS.INVALID)
      } else if (err.status === 400 && err.body?.questionId) {
        setReturnTo({ questionId: err.body.questionId, error: err.message })
        setScreen(SCREENS.REFLECTION)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  switch (screen) {
    case SCREENS.LOADING:
      return <div className="mx-auto max-w-lg text-center text-muted">Loading...</div>

    case SCREENS.INVALID:
      return (
        <div className="mx-auto max-w-lg">
          <div className={`${card} text-center`}>
            <h1 className={heading}>
              {invalidReason === 'used' ? 'All done!' : 'Link unavailable'}
            </h1>
            <p className="mt-3 text-muted">
              {message || 'This link has expired or already been used.'}
            </p>
          </div>
        </div>
      )

    case SCREENS.LOAD_ERROR:
      return (
        <div className="mx-auto max-w-lg space-y-4">
          <div className={errorBox}>{message}</div>
          <button type="button" onClick={load} className={`${primaryButton} w-full`}>
            Try again
          </button>
        </div>
      )

    case SCREENS.HOME:
      return <HomeScreen onStart={() => setScreen(SCREENS.REFLECTION)} />

    case SCREENS.REFLECTION:
      return (
        <ReflectionFlow
          config={intake.config}
          answers={answers}
          followUps={followUps}
          onAnswer={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          onFollowUp={(id, value) => setFollowUps((prev) => ({ ...prev, [id]: value }))}
          onComplete={() => setScreen(SCREENS.HANDOFF)}
          returnTo={returnTo}
        />
      )

    case SCREENS.HANDOFF:
      return (
        <TeacherHandoff
          teacherEmail={intake.teacherEmail}
          onSend={handleSend}
          onBack={handleBackToReflection}
          loading={loading}
          error={error}
        />
      )

    case SCREENS.CONFIRMATION:
      return <Confirmation teacherEmail={intake.teacherEmail} />
  }
}
