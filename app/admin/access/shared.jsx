'use client'

// Small pieces shared by the Access page's tabs.

/** fetch wrapper for the access API: resolves to { ok, data, error }. */
export async function accessApi(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: data.error ?? 'Something went wrong. Try again.' }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Network error. Check your connection and try again.' }
  }
}

export function RolePill({ role, small = false }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white font-medium text-slate-700 ${
        small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: role.color }} aria-hidden="true" />
      <span className="truncate">{role.name}</span>
    </span>
  )
}
