// Small presentational primitives shared across the admin pages. Plain markup,
// no client hooks, so server components can render them directly.

/**
 * The admin's primary button treatment: pass as `className` to <Button>.
 *
 * The admin deliberately uses a neutral slate action colour rather than the
 * storefront's brown, so it reads as a tool instead of a shop. Defined once
 * here because the foreground colour is the important part — five call sites
 * previously set `bg-slate-900` alone and inherited the near-black body colour,
 * rendering black text on a black button.
 */
export const adminPrimaryButton =
  'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400'

// Bare icon buttons (edit, remove-row) are plain <button>s rather than <Button>,
// so they inherit no focus styling. Without an explicit focus-visible ring a
// keyboard user tabbing through the product form gets no indication of where
// they are. Two tones: neutral for edit, danger for remove.
const iconButtonBase =
  'rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-30 disabled:hover:bg-transparent'

export const adminIconButton =
  `${iconButtonBase} text-slate-400 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400`

export const adminDangerIconButton =
  `${iconButtonBase} text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-400`

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export function Panel({ title, description, className = '', children }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-lg ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatTile({ label, value, hint }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  )
}

export function EmptyState({ children }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-500">{children}</p>
}

export function FieldRow({ label, value, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-1.5 text-sm ${className}`}>
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 text-right break-all">{value}</span>
    </div>
  )
}
