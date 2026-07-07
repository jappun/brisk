import { useState } from 'react'
import ReflectionFlow from './components/ReflectionFlow'
import TeacherHandoff from './components/TeacherHandoff'
import Confirmation from './components/Confirmation'
import { EMPTY_RESPONSES, synthesize, sendSummary } from './api'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleResponseChange(key, value) {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSend(email) {
    setLoading(true)
    setError(null)
    try {
      const result = await synthesize(responses)
      setSummary(result)
      await sendSummary(email, responses, result)
      setTeacherEmail(email)
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
          onComplete={() => setScreen(SCREENS.HANDOFF)}
        />
      )}

      {screen === SCREENS.HANDOFF && (
        <TeacherHandoff onSend={handleSend} loading={loading} error={error} />
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
