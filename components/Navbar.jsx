'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Menu, X, User, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import useCartStore from '@/lib/cart-store'

const serif = { fontFamily: 'var(--font-playfair), Georgia, serif' }

const collectionsMenu = [
  { name: 'Men', href: '/collections/men' },
  { name: 'Women', href: '/collections/women' },
  { name: 'Kids', href: '/collections/kids' },
]

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Collections', href: '/collections', dropdown: collectionsMenu },
  { name: 'Uniforms', href: '/collections/uniforms' },
  { name: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const profileRef = useRef(null)
  const pathname = usePathname()

  // Only the homepage has a full-bleed hero behind the bar, so only there does it
  // make sense to go see-through — every other page starts on a plain cream body,
  // where transparent + white text would be unreadable.
  const isHome = pathname === '/'
  const transparent = isHome && !scrolled

  const linkColorCls = transparent
    ? 'text-white hover:text-white/70'
    : 'text-[var(--color-primary-dark)] hover:text-[var(--color-primary)]'
  const iconColorCls = transparent ? 'text-white' : 'text-[var(--color-primary)]'
  const iconHoverBgCls = transparent ? 'hover:bg-white/10' : 'hover:bg-[var(--color-secondary)]/10'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Morph the bar into a floating capsule once the page is scrolled
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      {/* Full-width background layer — solid bar at top, transparent once scrolled so the capsule can float */}
      {/* Single shape that morphs (full-width bar -> floating pill) instead of fading, so no band appears over the hero.
          Every animated value must interpolate across the whole 500ms or the morph jerks at its ends:
          - max-width goes 100% -> 64rem (the browser blends % and px via calc), never through lengths
            wider than the viewport, which would freeze the width and then dump the shrink into the tail.
          - radius is a finite 2rem (= half the 64px pill height, so still a true pill) because
            rounded-full computes to calc(infinity*1px) and snaps fully round on the first frame.
          On the homepage the bar also starts fully transparent over the hero photo and fades in the
          cream fill as it morphs into the pill, instead of snapping opaque the moment scrolled flips. */}
      <div
        className={`w-full mx-auto flex items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
          scrolled
            ? 'mt-3 h-16 max-w-5xl rounded-[2rem] shadow-lg ring-1 ring-[var(--color-secondary)]/30 bg-[var(--color-cream)]/95'
            : transparent
              ? 'mt-0 h-20 max-w-full rounded-none shadow-none bg-transparent'
              : 'mt-0 h-20 max-w-full rounded-none shadow-sm bg-[var(--color-cream)]/95'
        }`}
      >
        {/* Content stays centered at max-w-7xl at the top, and fills the pill once scrolled */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/macdame.png"
            alt="MacDame"
            width={120}
            height={80}
            priority
            className="h-18 w-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-9">
          {navLinks.map((link) =>
            link.dropdown ? (
              <div key={link.name} className="relative group">
                <Link
                  href={link.href}
                  className={`flex items-center gap-1 text-[15px] tracking-wide transition-colors duration-500 ${linkColorCls}`}
                  style={serif}
                  aria-haspopup="true"
                >
                  {link.name}
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180 motion-reduce:transition-none" />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[var(--color-secondary)] group-hover:w-full transition-all duration-300 motion-reduce:transition-none" />
                </Link>

                {/* Dropdown panel (revealed on hover / keyboard focus) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-52 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-200 motion-reduce:transition-none">
                  <div className="rounded-xl border border-[var(--color-secondary)]/40 bg-[var(--color-cream)] shadow-xl py-2">
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="group/item flex items-center justify-between px-5 py-2.5 text-[15px] text-[var(--color-primary-dark)] hover:bg-[var(--color-secondary)]/10 hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:bg-[var(--color-secondary)]/10"
                        style={serif}
                      >
                        {item.name}
                        <ChevronRight className="h-4 w-4 text-[var(--color-secondary)] transition-transform duration-200 group-hover/item:translate-x-1 motion-reduce:transition-none" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[15px] tracking-wide transition-colors duration-500 relative group ${linkColorCls}`}
                style={serif}
              >
                {link.name}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[var(--color-secondary)] group-hover:w-full transition-all duration-300 motion-reduce:transition-none" />
              </Link>
            )
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Profile / Sign In */}
          {!loading && (
            user ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName || 'Profile'}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--color-secondary)]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-semibold text-sm">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login"><Button
                variant="ghost"
                size="icon"
                className={`hidden md:flex transition-colors duration-500 ${iconHoverBgCls}`}
              >
                <User className={`h-5 w-5 transition-colors duration-500 ${iconColorCls}`} />
              </Button></Link>
            )
          )}

          <Link href="/cart"><Button
            variant="ghost"
            size="icon"
            className={`relative transition-colors duration-500 ${iconHoverBgCls}`}
          >
            <ShoppingBag className={`h-5 w-5 transition-colors duration-500 ${iconColorCls}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-terracotta)] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Button></Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden transition-colors duration-500 ${iconHoverBgCls}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className={`h-6 w-6 transition-colors duration-500 ${iconColorCls}`} />
            ) : (
              <Menu className={`h-6 w-6 transition-colors duration-500 ${iconColorCls}`} />
            )}
          </Button>
        </div>
      </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mx-4 mt-2 bg-[var(--color-cream)] rounded-2xl border border-[var(--color-secondary)]/30 shadow-lg animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div key={link.name}>
                  <button
                    onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                    className="w-full flex items-center justify-between py-3 px-4 text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded-lg transition-colors"
                    style={serif}
                    aria-expanded={isCollectionsOpen}
                  >
                    {link.name}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${isCollectionsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isCollectionsOpen && (
                    <div className="pl-4 space-y-1">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center justify-between py-2.5 px-4 text-sm text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded-lg transition-colors"
                          style={serif}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.name}
                          <ChevronRight className="h-4 w-4 text-[var(--color-secondary)]" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block py-3 px-4 text-[var(--color-primary-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded-lg transition-colors"
                  style={serif}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
            )}
            <div className="pt-2 border-t border-gray-200">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 py-2 px-4">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={userName || 'Profile'}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--color-secondary)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-semibold text-xs">
                        {userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut()
                    }}
                    className="flex items-center gap-2 w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block py-3 px-4 text-[var(--color-primary)] font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
