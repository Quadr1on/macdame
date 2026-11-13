import { formatCurrency } from '@/lib/order-status'
import { formatShopDay } from '@/lib/admin-metrics'

// Daily paid revenue as a plain bar chart. Built from divs rather than a chart
// library: thirty bars need no dependency, it renders on the server, and it
// stretches to any width without distorting text the way a scaled SVG would.
//
// Hover titles give exact figures on desktop; a visually hidden table carries
// the same numbers for screen readers.
export default function RevenueChart({ days }) {
  const max = Math.max(0, ...days.map((d) => d.revenue))
  const total = days.reduce((sum, d) => sum + d.revenue, 0)
  const first = days[0]
  const last = days[days.length - 1]
  const middle = days[Math.floor(days.length / 2)]

  if (days.length === 0 || max === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-200 px-4 text-center text-sm text-slate-500">
        No paid orders in the last {days.length} days, so there is nothing to chart yet.
      </div>
    )
  }

  return (
    <figure>
      <div className="flex items-start gap-2">
        <div className="flex h-40 flex-col justify-between w-16 text-[11px] tabular-nums text-slate-400 text-right shrink-0">
          <span>{formatCurrency(max)}</span>
          <span>₹0</span>
        </div>
        <div
          className="relative flex h-40 flex-1 items-end gap-[2px] border-b border-l border-slate-200 pl-px sm:gap-1"
          aria-hidden="true"
        >
          {/* Midline so bar heights can be read at a glance. */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-100" />
          {days.map((d) => {
            const height = d.revenue === 0 ? 0 : Math.max(2, (d.revenue / max) * 100)
            const isToday = d === last
            return (
              <div
                key={d.day}
                title={`${formatShopDay(d.day)}: ${formatCurrency(d.revenue)} · ${d.orders} paid order${d.orders === 1 ? '' : 's'}`}
                className="group relative flex h-full flex-1 items-end"
              >
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    d.revenue === 0
                      ? 'h-px bg-slate-200'
                      : isToday
                        ? 'bg-slate-900 group-hover:bg-slate-700'
                        : 'bg-slate-400 group-hover:bg-slate-700'
                  }`}
                  style={d.revenue === 0 ? undefined : { height: `${height}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between pl-[4.5rem] text-[11px] text-slate-400" aria-hidden="true">
        <span>{formatShopDay(first.day)}</span>
        <span className="hidden sm:inline">{formatShopDay(middle.day)}</span>
        <span>Today</span>
      </div>

      <figcaption className="sr-only">
        Paid revenue per day for the last {days.length} days, {formatCurrency(total)} in total.
      </figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Revenue</th>
            <th scope="col">Paid orders</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td>{formatShopDay(d.day, { day: 'numeric', month: 'long' })}</td>
              <td>{formatCurrency(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
