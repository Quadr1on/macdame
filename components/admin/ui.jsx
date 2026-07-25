// Small presentational primitives shared across the admin pages. Plain markup,
// no client hooks, so server components can render them directly.

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
