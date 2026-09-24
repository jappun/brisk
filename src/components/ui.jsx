// Shared Tailwind class strings so the accent color is applied consistently
// (primary actions only) and everything else stays neutral.

export const card = 'rounded-2xl border border-neutral-200 bg-white p-8'

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-neutral-300'

export const secondaryButton =
  'inline-flex items-center justify-center rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'

export const textButton =
  'rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-ink disabled:invisible'

export const input =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-ink placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'

export const eyebrow = 'text-sm font-semibold uppercase tracking-wide text-muted'

export const heading = 'font-display text-4xl uppercase leading-tight tracking-wide text-ink'

export const errorBox = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
  )
}
