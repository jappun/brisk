import TeacherConfig from './components/TeacherConfig'
import StudentIntake from './components/StudentIntake'

function getIntakeToken() {
  const match = window.location.pathname.match(/^\/intake\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function App() {
  const token = getIntakeToken()

  return (
    <div className="min-h-screen bg-white px-4 py-12 font-sans text-ink">
      {token ? <StudentIntake token={token} /> : <TeacherConfig />}
    </div>
  )
}
