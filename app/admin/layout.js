import { redirect, notFound } from 'next/navigation'
import { getAdminUser } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'Admin · Macdame',
  robots: { index: false, follow: false },
}

// Admin pages read live order and inventory data — never serve a cached copy.
export const dynamic = 'force-dynamic'

// Gate #1 of two. This covers page renders under /admin only; route handlers
// are not wrapped by layouts, so every /api/admin/* route calls
// requireAdminApi() for itself. Do not remove that on the assumption this is
// enough.
export default async function AdminLayout({ children }) {
  const { user, reason } = await getAdminUser()

  if (reason === 'unauthenticated') redirect('/login?next=/admin')
  // A signed-in non-admin gets a plain 404 rather than a 403, so the dashboard's
  // existence isn't advertised to ordinary customers.
  if (reason === 'forbidden') notFound()

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AdminSidebar email={user.email} />
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
