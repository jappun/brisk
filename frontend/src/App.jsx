import { useEffect, useState } from 'react'
import ReflectionFlow from './components/ReflectionFlow'
import TeacherHandoff from './components/TeacherHandoff'
import Confirmation from './components/Confirmation'
import { EMPTY_RESPONSES, QUESTIONS, getConfig, synthesize, sendSummary } from './api'
import { validateAllResponses } from './validateAnswer'

const SCREENS = {
  REFLECTION: 'reflection',
  HANDOFF: 'handoff',
  CONFIRMATION: 'confirmation',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.REFLECTION)
  const [responses, setResponses] = useState(EMPTY_RESPONSES)
  const [summary, setSummary] = useState(null)
  const [teacherEmail, setTeacherEmail] = useState('')
  const [configReady, setConfigReady] = useState(false)
  const [configError, setConfigError] = useState(null)
  const [reflectionStep, setReflectionStep] = useState(0)
  const [reflectionError, setReflectionError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getConfig()
      .then((config) => {
        if (!config.teacher_email) {
          throw new Error('TEACHER_EMAIL is not configured on the server.')
        }
        setTeacherEmail(config.teacher_email)
      })
      .catch((err) => {
        setConfigError(err.message)
      })
      .finally(() => {
        setConfigReady(true)
      })
  }, [])

  function handleResponseChange(key, value) {
    setReflectionError(null)
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  function handleReflectionComplete() {
    const invalid = validateAllResponses(responses, QUESTIONS)
    if (invalid) {
      const step = QUESTIONS.findIndex((q) => q.key === invalid.key)
      setReflectionStep(step >= 0 ? step : 0)
      setReflectionError(invalid.error)
      setScreen(SCREENS.REFLECTION)
      return
    }
    setReflectionError(null)
    setError(null)
    setScreen(SCREENS.HANDOFF)
  }

  function handleBackToReflection() {
    setError(null)
    setReflectionStep(QUESTIONS.length - 1)
    setScreen(SCREENS.REFLECTION)
  }

  async function handleSend() {
    const invalid = validateAllResponses(responses, QUESTIONS)
    if (invalid) {
      const step = QUESTIONS.findIndex((q) => q.key === invalid.key)
      setReflectionStep(step >= 0 ? step : 0)
      setReflectionError(invalid.error)
      setScreen(SCREENS.REFLECTION)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await synthesize(responses)
      setSummary(result)
      const sendResult = await sendSummary(teacherEmail, responses, result)
      setTeacherEmail(sendResult.teacher_email)
      setScreen(SCREENS.CONFIRMATION)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-12">
      {screen === SCREENS.REFLECTION && (
        <ReflectionFlow
          responses={responses}
          onChange={handleResponseChange}
          onComplete={handleReflectionComplete}
          initialStep={reflectionStep}
          externalError={reflectionError}
        />
      )}

      {screen === SCREENS.HANDOFF && !configReady && (
        <div className="mx-auto max-w-lg text-center text-stone-500">Loading...</div>
      )}

      {screen === SCREENS.HANDOFF && configReady && configError && (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center text-red-700">
          {configError}
        </div>
      )}

      {screen === SCREENS.HANDOFF && configReady && !configError && teacherEmail && (
        <TeacherHandoff
          teacherEmail={teacherEmail}
          onSend={handleSend}
          onBack={handleBackToReflection}
          loading={loading}
          error={error}
        />
      )}

      {screen === SCREENS.CONFIRMATION && summary && (
        <Confirmation
          teacherEmail={teacherEmail}
          responses={responses}
          summary={summary}
        />
      )}
    </div>
  )
}
