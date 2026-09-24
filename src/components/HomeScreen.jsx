import { card, eyebrow, heading, primaryButton } from './ui'

export default function HomeScreen({ onStart }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className={card}>
        <p className={eyebrow}>IEP Intake Companion</p>
        <h1 className={`mt-2 ${heading}`}>Hi! Your teacher wants to hear from you</h1>

        <p className="mt-6 text-base leading-relaxed text-muted">
          Just a few quick questions about how school&apos;s going. There are no
          wrong answers — say it however feels right. Your teacher will read
          everything you write.
        </p>

        <button type="button" onClick={onStart} className={`${primaryButton} mt-8 w-full`}>
          Let&apos;s go
        </button>
      </div>
    </div>
  )
}
