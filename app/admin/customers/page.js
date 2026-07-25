import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader, Panel, EmptyState } from '@/components/admin/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatOrderDate } from '@/lib/order-status'

export default async function AdminCustomersPage() {
  const admin = createAdminClient()

  const [{ data: profiles, error }, { data: authList }, { data: orders }] = await Promise.all([
    admin.from('users_profile').select('*').order('created_at', { ascending: false }),
    // users_profile has no email column — emails live on auth.users, reachable
    // only through the admin auth API with the service role key.
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('orders').select('user_id, total_amount, payment_status'),
  ])

  const emailById = new Map((authList?.users ?? []).map((user) => [user.id, user.email]))

  const rows = (profiles ?? []).map((profile) => {
    const theirs = (orders ?? []).filter((order) => order.user_id === profile.id)
    const spend = theirs
      .filter((order) => order.payment_status === 'paid')
      .reduce((sum, order) => sum + Number(order.total_amount), 0)

    return {
      ...profile,
      email: emailById.get(profile.id) ?? '—',
      orderCount: theirs.length,
      spend,
    }
  })

  return (
    <>
      <PageHeader
        title="Customers"
        description={
          error ? 'Could not load customers' : `${rows.length} registered account${rows.length === 1 ? '' : 's'}`
        }
      />

      <Panel>
        {error ? (
          <EmptyState>Failed to load customers: {error.message}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No customer accounts yet.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="px-4 text-slate-500">Name</TableHead>
                <TableHead className="text-slate-500">Email</TableHead>
                <TableHead className="text-slate-500">Phone</TableHead>
                <TableHead className="text-slate-500">Joined</TableHead>
                <TableHead className="text-slate-500 text-right">Orders</TableHead>
                <TableHead className="px-4 text-slate-500 text-right">Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="px-4 font-medium text-slate-900">
                    {customer.full_name || '—'}
                  </TableCell>
                  <TableCell className="text-slate-600">{customer.email}</TableCell>
                  <TableCell className="text-slate-600">{customer.phone || '—'}</TableCell>
                  <TableCell className="text-slate-600">
                    {formatOrderDate(customer.created_at)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {customer.orderCount > 0 ? (
                      <Link
                        href={`/admin/orders?customer=${customer.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {customer.orderCount}
                      </Link>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-right tabular-nums text-slate-900">
                    {formatCurrency(customer.spend)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}
