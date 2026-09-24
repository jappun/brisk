import { card, heading } from './ui'

export default function Confirmation({ teacherEmail }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className={`${card} text-center`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white">
          ✓
        </div>
        <h1 className={heading}>All done!</h1>
        <p className="mt-3 text-muted">
          Sent to <span className="font-semibold text-ink">{teacherEmail}</span>. Thanks
          for being so honest.
        </p>
      </div>

      <p className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-5 text-sm text-muted">
        <span className="font-semibold text-ink">Demo users:</span> didn&apos;t get the
        teacher email? Check your spam folder.
      </p>
    </div>
  )
}
