// The admin permission vocabulary and the rules for who may manage whom.
// Pure functions with no server-only imports, so the Access page's client
// components can use the same labels and rules the API enforces.

export const PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'View dashboard', hint: 'Revenue, sales and stock figures' },
    ],
  },
  {
    key: 'orders',
    label: 'Orders',
    permissions: [
      { key: 'orders.view', label: 'View orders', hint: 'Order list and details, including the delivery address' },
      { key: 'orders.update', label: 'Update status and tracking', hint: 'Move orders along and set tracking IDs' },
      { key: 'orders.cancel', label: 'Cancel orders' },
      { key: 'orders.notes', label: 'Add notes', hint: 'Write and delete their own private notes' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    permissions: [
      { key: 'customers.view', label: 'View customers', hint: 'Names, emails, phone numbers and spend' },
    ],
  },
  {
    key: 'products',
    label: 'Products',
    permissions: [
      { key: 'products.view', label: 'View products' },
      { key: 'products.edit', label: 'Create and edit products', hint: 'Includes hiding them from the shop and uploading photos' },
      { key: 'products.delete', label: 'Delete products' },
    ],
  },
  {
    key: 'collections',
    label: 'Collections',
    permissions: [{ key: 'collections.manage', label: 'Manage collections' }],
  },
  {
    key: 'access',
    label: 'Access',
    permissions: [
      {
        key: 'access.manage',
        label: 'Manage members and roles',
        hint: 'Only for roles below their own, and only with permissions they have',
        dangerous: true,
      },
    ],
  },
]

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((p) => p.key))

export function isPermission(key) {
  return ALL_PERMISSIONS.includes(key)
}

export function permissionLabel(key) {
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find((p) => p.key === key)
    if (found) return found.label
  }
  return key
}

/** Where each admin section lives and what it takes to open it, in sidebar order. */
export const ADMIN_SECTIONS = [
  { key: 'dashboard', href: '/admin', permission: 'dashboard.view' },
  { key: 'orders', href: '/admin/orders', permission: 'orders.view' },
  { key: 'products', href: '/admin/products', permission: 'products.view' },
  { key: 'collections', href: '/admin/collections', permission: 'collections.manage' },
  { key: 'customers', href: '/admin/customers', permission: 'customers.view' },
  { key: 'access', href: '/admin/access', permission: 'access.manage' },
]

/** First section this person may open, for landing them somewhere useful. */
export function firstAllowedSection(permissions) {
  return ADMIN_SECTIONS.find((section) => permissions.includes(section.permission)) ?? null
}

/**
 * Turns "is an owner" plus a member's roles into what they can do.
 * `position` is their most senior role's position (Owners rank above
 * every role), or -Infinity with no roles.
 */
export function resolveAccess({ isOwner, roles = [] }) {
  if (isOwner) {
    return { isOwner: true, permissions: [...ALL_PERMISSIONS], position: Infinity }
  }
  const permissions = new Set()
  let position = -Infinity
  for (const role of roles) {
    for (const key of role.permissions ?? []) if (isPermission(key)) permissions.add(key)
    if (role.position > position) position = role.position
  }
  return { isOwner: false, permissions: [...permissions], position }
}

export function can(access, permission) {
  return Boolean(access?.permissions?.includes(permission))
}

/** A role is manageable only if it sits strictly below the actor's highest role. */
export function canManageRole(actor, role) {
  return can(actor, 'access.manage') && role.position < actor.position
}

/** A member is manageable if every role they hold sits below the actor's highest role. */
export function canManageMember(actor, memberRoles) {
  if (!can(actor, 'access.manage')) return false
  return memberRoles.every((role) => role.position < actor.position)
}

/** Permissions the actor may not hand out because they don't hold them. */
export function ungrantable(actor, permissions) {
  if (actor.isOwner) return []
  return permissions.filter((key) => !actor.permissions.includes(key))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normaliseEmail(raw) {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null
}

export const ROLE_COLOURS = [
  '#64748b', '#dc2626', '#ea580c', '#d97706', '#16a34a',
  '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#db2777',
]
