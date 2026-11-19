// Placeholder shown while the dashboard's queries are in flight. Mirrors the
// real layout (four tiles, a wide column and a narrow one) so nothing jumps
// when the data lands.

function Bar({ className = '' }) {
  return <div className={`rounded bg-slate-100 ${className}`} />
}

function PanelSkeleton({ rows = 4, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-4 py-3 border-b border-slate-200">
        <Bar className="h-4 w-32" />
      </div>
      {children ?? (
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }, (_, i) => (
            <Bar key={i} className="h-4 w-full" />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading dashboard">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <Bar className="h-3 w-24" />
            <Bar className="h-7 w-20" />
            <Bar className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PanelSkeleton>
            <div className="p-4 space-y-5">
              <div className="grid grid-cols-3 gap-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <Bar className="h-3 w-16" />
                    <Bar className="h-6 w-20" />
                  </div>
                ))}
              </div>
              <Bar className="h-40 w-full" />
            </div>
          </PanelSkeleton>
          <PanelSkeleton rows={6} />
        </div>
        <div className="space-y-4">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={4} />
        </div>
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  )
}
