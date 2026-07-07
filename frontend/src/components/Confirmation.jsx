export default function Confirmation({ teacherEmail }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold text-stone-800">All done!</h1>
        <p className="mt-2 text-stone-600">
          Sent to{' '}
          <span className="font-medium text-stone-800">{teacherEmail}</span>
        </p>
        <p className="mt-4 text-sm text-stone-500">
          Your teacher will receive an email with a summary and your full answers.
        </p>
      </div>
    </div>
  )
}
