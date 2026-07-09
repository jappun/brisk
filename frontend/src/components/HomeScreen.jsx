export default function HomeScreen({ onStart }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-amber-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-amber-700">IEP Intake Companion</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-stone-800">
          Share your perspective before your IEP meeting
        </h1>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-stone-600">
          <p>
            Your teacher wants to understand how school feels for you — what
            works, what&apos;s hard, and what you&apos;d like to be different.
            This will help them support you better.
          </p>
          <p>
            There are no right or wrong answers here. Just say what&apos;s true for you, in your own words.
          </p>
          <p>
            When you&apos;re done, your answers go to your teacher so they can
            hear directly from you.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-8 w-full rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
        >
          Get started
        </button>
      </div>
    </div>
  )
}
