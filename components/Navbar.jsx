'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Package,
  MapPin,
  LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import useCartStore from '@/lib/cart-store'
import { useCollectionsMenu } from '@/lib/collections-menu'

/*
 * The site navbar, after the fashion headers on Awwwards (Morrow, Seed
 * Jewelry): three zones on one line — links left, the logo centred, account and
 * cart right. On a phone the menu button takes the left and the cart stays on
 * the right, so the bag is always one tap away.
 *
 * - Over a full-screen photo (home, collection pages) it starts transparent
 *   with white type over a soft top shade, and turns solid cream once scrolled.
 * - It slides away while you scroll down and comes back as soon as you scroll
 *   up, so on a phone the page gets the whole screen.
 * - The phone menu is a sheet from the left: every collection listed directly
 *   (no accordion), 56px rows, the account at the foot, Esc or a tap outside
 *   to close.
 */

// Collections promoted out of the Shop dropdown into their own top-level item.
// Driven off the database list, so a pinned slug that doesn't exist yet simply
// doesn't render.
const pinnedCollectionSlugs = ['uniforms']

const accountLinks = [
  { name: 'My orders', href: '/account/orders', icon: Package },
  { name: 'Saved addresses', href: '/account/addresses', icon: MapPin },
]

function CartCount({ count }) {
  if (count <= 0) return null
  return (
    <span className="absolute right-0.5 top-0.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-[var(--color-terracotta)] px-1 text-[11px] font-medium leading-none text-white tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Avatar({ url, name, size = 'size-8' }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`${size} rounded-full object-cover`} referrerPolicy="no-referrer" />
  ) : (
    <span className={`${size} grid place-items-center rounded-full bg-[var(--color-primary)] text-sm font-medium text-[var(--color-cream)]`}>
      {name?.charAt(0)?.toUpperCase() || 'U'}
    </span>
  )
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const collections = useCollectionsMenu()
  const { user, loading, isAdmin, signOut } = useAuth()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const pathname = usePathname()
  const profileRef = useRef(null)
  const menuButtonRef = useRef(null)
  const closeButtonRef = useRef(null)

  const pinned = collections.filter((c) => pinnedCollectionSlugs.includes(c.slug))
  const grouped = collections.filter((c) => !pinnedCollectionSlugs.includes(c.slug))

  // Pages that open on a full-screen photograph sit under a see-through bar.
  const overPhoto =
    (pathname === '/' || pathname === '/shop' || pathname.startsWith('/collections/')) && !scrolled

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
    menuButtonRef.current?.focus()
  }, [])

  // Solid once scrolled; hide on the way down, show on the way up.
  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 24)
        setPastHero(y > window.innerHeight * 0.85)
        if (Math.abs(y - lastY) > 6) {
          setHidden(y > lastY && y > 160)
          lastY = y
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // A new page closes whatever was open.
  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
  }, [pathname])

  // The sheet: lock the page behind it, focus its close button, Esc closes it.
  useEffect(() => {
    if (!isMenuOpen) return
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && closeMenu()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isMenuOpen, closeMenu])

  // The desktop profile panel closes on an outside click or Esc.
  useEffect(() => {
    if (!isProfileOpen) return
    const onDown = (e) => !profileRef.current?.contains(e.target) && setIsProfileOpen(false)
    const onKey = (e) => e.key === 'Escape' && setIsProfileOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [isProfileOpen])

  const isActive = (href) => (href === '/shop' ? pathname === '/shop' : pathname.startsWith(href))
  const iconBtn = 'relative grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-current/10'
  const linkCls = 'relative inline-flex h-11 items-center text-[15px] font-medium'

  return (
    <MotionConfig reducedMotion="user">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[translate,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          hidden && !isMenuOpen && !isProfileOpen ? '-translate-y-full' : ''
        } ${
          overPhoto
            ? 'text-white'
            : 'bg-[var(--color-cream)] text-[var(--ink)] shadow-[0_1px_0_var(--line)]'
        }`}
      >
        {/* A soft shade under the bar keeps white type readable over any photograph. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent transition-opacity duration-300 ${overPhoto ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className="page-wrap relative grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[72px]">
          {/* Left: the menu button on a phone, the links on a desktop */}
          <div className="flex items-center">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className={`${iconBtn} -ml-2.5 lg:hidden`}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
            >
              <Menu className="size-6" strokeWidth={1.75} />
            </button>

            <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
              <div className="group relative">
                <Link href="/shop" className={linkCls} aria-haspopup="true">
                  <span className={`link-draw ${isActive('/shop') ? '!bg-[length:100%_1px]' : ''}`}>Shop</span>
                  <ChevronDown className="ml-1 size-4 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
                </Link>
                <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-[opacity,visibility,translate] duration-200 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0">
                  <ul className="min-w-56 rounded-lg bg-[var(--color-cream)] p-2 text-[var(--ink)] shadow-[0_12px_32px_rgb(36_23_16/0.14)] ring-1 ring-[var(--line)]">
                    <li>
                      <Link href="/shop" className="flex h-11 items-center rounded-md px-3 font-medium hover:bg-[var(--color-cream-dark)]">
                        All clothing
                      </Link>
                    </li>
                    {grouped.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className="flex h-11 items-center rounded-md px-3 hover:bg-[var(--color-cream-dark)]">
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {pinned.map((item) => (
                <Link key={item.href} href={item.href} className={linkCls}>
                  <span className={`link-draw ${isActive(item.href) ? '!bg-[length:100%_1px]' : ''}`}>{item.name}</span>
                </Link>
              ))}
              <Link href="/contact" className={linkCls}>
                <span className={`link-draw ${isActive('/contact') ? '!bg-[length:100%_1px]' : ''}`}>Contact</span>
              </Link>
            </nav>
          </div>

          {/* Centre: the logo. On the home page the large scroll logo stands
              in for it — always on a desktop, and on a phone until the hero
              has gone (the scroll logo fades out there). */}
          <Link
            href="/"
            className={`flex items-center transition-opacity duration-300 ${
              pathname === '/' ? (pastHero ? 'lg:invisible lg:opacity-0' : 'invisible opacity-0') : ''
            }`}
            aria-label="MacDame home"
          >
            <Image
              src="/macdame.png"
              alt="MacDame"
              width={120}
              height={80}
              priority
              // The gold script sinks into a warm photograph, so over one it
              // turns into a white silhouette (the PNG is transparent).
              className={`h-12 w-auto object-contain transition-[filter] duration-300 lg:h-14 ${overPhoto ? 'brightness-0 invert' : ''}`}
            />
          </Link>

          {/* Right: account and cart */}
          <div className="-mr-2.5 flex items-center justify-end gap-0.5">
            {!loading &&
              (user ? (
                <div className="relative hidden lg:block" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    className={iconBtn}
                    aria-label="Your account"
                    aria-expanded={isProfileOpen}
                  >
                    <Avatar url={avatarUrl} name={userName} />
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 rounded-lg bg-[var(--color-cream)] p-2 text-[var(--ink)] shadow-[0_12px_32px_rgb(36_23_16/0.14)] ring-1 ring-[var(--line)]">
                      <div className="border-b border-[var(--line)] px-3 pb-3 pt-2">
                        <p className="truncate font-medium">{userName}</p>
                        <p className="truncate text-sm text-[var(--muted)]">{user.email}</p>
                      </div>
                      <ul className="pt-1">
                        {accountLinks.map(({ name, href, icon: Icon }) => (
                          <li key={href}>
                            <Link href={href} className="flex h-11 items-center gap-3 rounded-md px-3 hover:bg-[var(--color-cream-dark)]">
                              <Icon className="size-4 text-[var(--muted)]" />
                              {name}
                            </Link>
                          </li>
                        ))}
                        {isAdmin && (
                          <li>
                            <Link href="/admin" className="flex h-11 items-center gap-3 rounded-md px-3 hover:bg-[var(--color-cream-dark)]">
                              <LayoutDashboard className="size-4 text-[var(--muted)]" />
                              Admin dashboard
                            </Link>
                          </li>
                        )}
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false)
                              signOut()
                            }}
                            className="flex h-11 w-full items-center gap-3 rounded-md px-3 hover:bg-[var(--color-cream-dark)]"
                          >
                            <LogOut className="size-4 text-[var(--muted)]" />
                            Sign out
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={`${iconBtn} hidden lg:grid`} aria-label="Sign in">
                  <User className="size-[22px]" strokeWidth={1.75} />
                </Link>
              ))}

            <Link
              href="/cart"
              className={iconBtn}
              aria-label={totalItems > 0 ? `Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Cart'}
            >
              <ShoppingBag className="size-[22px]" strokeWidth={1.75} />
              <CartCount count={totalItems} />
            </Link>
          </div>
        </div>
      </header>

      {/* The phone menu: a sheet from the left over a dimmed page. */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMenu}
              aria-hidden="true"
            />
            <motion.div
              key="sheet"
              id="site-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-[61] flex w-[min(88vw,400px)] flex-col bg-[var(--color-cream)] text-[var(--ink)] lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex h-16 shrink-0 items-center justify-between px-3">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeMenu}
                  className="grid size-11 place-items-center rounded-full hover:bg-[var(--color-cream-dark)]"
                  aria-label="Close menu"
                >
                  <X className="size-6" strokeWidth={1.75} />
                </button>
                <Link href="/cart" onClick={closeMenu} className="relative grid size-11 place-items-center rounded-full hover:bg-[var(--color-cream-dark)]" aria-label="Cart">
                  <ShoppingBag className="size-[22px]" strokeWidth={1.75} />
                  <CartCount count={totalItems} />
                </Link>
              </div>

              <nav className="flex-1 overflow-y-auto px-6 pb-6" aria-label="Menu">
                <ul>
                  {[{ name: 'All clothing', href: '/shop' }, ...grouped, ...pinned, { name: 'Contact', href: '/contact' }].map((item) => (
                    <li key={item.href} className="border-b border-[var(--line)]">
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex min-h-14 items-center justify-between font-display text-[26px] leading-tight ${isActive(item.href) && item.href !== '/' ? 'text-[var(--color-primary)]' : ''}`}
                      >
                        {item.name}
                        <ChevronDown className="size-5 -rotate-90 text-[var(--muted)]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="shrink-0 border-t border-[var(--line)] bg-[var(--color-cream-dark)]/50 px-6 py-5">
                {!loading &&
                  (user ? (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <Avatar url={avatarUrl} name={userName} size="size-10" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{userName}</p>
                          <p className="truncate text-sm text-[var(--muted)]">{user.email}</p>
                        </div>
                      </div>
                      <ul>
                        {accountLinks.map(({ name, href, icon: Icon }) => (
                          <li key={href}>
                            <Link href={href} onClick={closeMenu} className="flex h-12 items-center gap-3">
                              <Icon className="size-[18px] text-[var(--muted)]" />
                              {name}
                            </Link>
                          </li>
                        ))}
                        {isAdmin && (
                          <li>
                            <Link href="/admin" onClick={closeMenu} className="flex h-12 items-center gap-3">
                              <LayoutDashboard className="size-[18px] text-[var(--muted)]" />
                              Admin dashboard
                            </Link>
                          </li>
                        )}
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              closeMenu()
                              signOut()
                            }}
                            className="flex h-12 w-full items-center gap-3"
                          >
                            <LogOut className="size-[18px] text-[var(--muted)]" />
                            Sign out
                          </button>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <Link href="/login" onClick={closeMenu} className="btn btn-primary w-full">
                      <User className="size-[18px]" strokeWidth={1.75} />
                      Sign in
                    </Link>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
