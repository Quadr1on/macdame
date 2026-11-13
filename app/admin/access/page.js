import { getAdminUser, ownerEmails } from '@/lib/admin-auth'
import { can } from '@/lib/admin-permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadMembers, loadRoles } from '@/lib/admin-access'
import { PageHeader, NoAccess } from '@/components/admin/ui'
import AccessManager from './AccessManager'

export const metadata = { title: 'Access · Macdame admin' }

export default async function AdminAccessPage({ searchParams }) {
  const { user, access } = await getAdminUser()
  if (!can(access, 'access.manage')) return <NoAccess what="access settings" />

  const params = await searchParams
  const admin = createAdminClient()
  const [rolesResult, membersResult, eventsResult] = await Promise.all([
    loadRoles(admin),
    loadMembers(admin),
    admin
      .from('admin_access_events')
      .select('id, actor_email, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const error = rolesResult.error ?? membersResult.error

  return (
    <>
      <PageHeader
        title="Access"
        description="Who can use this admin, and what each role is allowed to do"
      />
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load access settings: {error.message}
        </p>
      ) : (
        <AccessManager
          initialTab={params?.tab === 'roles' ? 'roles' : 'members'}
          roles={rolesResult.data ?? []}
          members={(membersResult.data ?? []).map((member) => ({
            id: member.id,
            email: member.email,
            addedBy: member.added_by,
            lastSeenAt: member.last_seen_at,
            createdAt: member.created_at,
            roleIds: (member.admin_member_roles ?? []).map((link) => link.role_id),
          }))}
          owners={ownerEmails()}
          events={eventsResult.data ?? []}
          eventsError={eventsResult.error?.message ?? null}
          viewer={{
            email: user.email,
            isOwner: access.isOwner,
            permissions: access.permissions,
            // Infinity doesn't survive the trip to a client component as a
            // plain number everywhere; send a flag plus a finite position.
            position: Number.isFinite(access.position) ? access.position : null,
          }}
        />
      )}
    </>
  )
}
