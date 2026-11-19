'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react'

// `permission` mirrors ADMIN_SECTIONS in lib/admin-permissions.js. Hiding a
// link is only a convenience: each page checks the permission on the server.
const links = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.view' },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, permission: 'orders.view' },
  { name: 'Products', href: '/admin/products', icon: Package, permission: 'products.view' },
  { name: 'Collections', href: '/admin/collections', icon: FolderTree, permission: 'collections.manage' },
  { name: 'Customers', href: '/admin/customers', icon: Users, permission: 'customers.view' },
  { name: 'Access', href: '/admin/access', icon: ShieldCheck, permission: 'access.manage' },
]

export default function AdminSidebar({ email, permissions = [], roleLabel }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // /admin must match exactly or it would light up on every child route.
  const isActive = (href) => (href === '/admin' ? pathname === href : pathname.startsWith(href))

  const nav = (
    <nav className="space-y-1">
      {links.filter((link) => permissions.includes(link.permission)).map(({ name, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(href)
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {name}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile: a top bar with a collapsible panel, since a fixed sidebar
          would eat most of a phone screen. */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-slate-900">Macdame Admin</span>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 -mr-2 text-slate-600"
            aria-label={open ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
            {nav}
            <Link
              href="/"
              className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to store
            </Link>
          </div>
        )}
      </div>

      {/* Desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 sticky top-0 h-screen">
        <div className="px-3 mb-6">
          <p className="font-semibold text-slate-900">Macdame Admin</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{email}</p>
          {roleLabel && <p className="text-xs font-medium text-slate-400 truncate mt-0.5">{roleLabel}</p>}
        </div>

        {nav}

        <Link
          href="/"
          className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>
      </aside>
    </>
  )
}
