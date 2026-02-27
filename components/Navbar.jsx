'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const profileRef = useRef(null)

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

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Collections', href: '/collections' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-cream)]/95 backdrop-blur-md border-b border-[var(--color-secondary)]/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              MacDame
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-[var(--color-primary)] font-medium transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-secondary)] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
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
                  className="hidden md:flex hover:bg-[var(--color-secondary)]/10"
                >
                  <User className="h-5 w-5 text-[var(--color-primary)]" />
                </Button></Link>
              )
            )}

            <Link href="/cart"><Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-[var(--color-secondary)]/10"
            >
              <ShoppingBag className="h-5 w-5 text-[var(--color-primary)]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-terracotta)] text-white text-xs rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </Button></Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-[var(--color-secondary)]/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-[var(--color-primary)]" />
              ) : (
                <Menu className="h-6 w-6 text-[var(--color-primary)]" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--color-cream)] border-b border-[var(--color-secondary)]/20 shadow-lg animate-in slide-in-from-top-2">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block py-3 px-4 text-gray-700 hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]/10 rounded-lg font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
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
      </div>
    </nav>
  )
}
