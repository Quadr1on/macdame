'use client'
import Link from 'next/link'
import Arrow from './home/Arrow'
import { useCollectionsMenu } from '@/lib/collections-menu'

// Every link here goes to a route that exists. The old footer linked FAQs,
// shipping, returns, size guide, about, story, artisans, blog and careers
// pages that were never built, and printed a placeholder phone and email.
const accountLinks = [
  { name: 'Your orders', href: '/account/orders' },
  { name: 'Saved addresses', href: '/account/addresses' },
  { name: 'Cart', href: '/cart' },
  { name: 'Sign in', href: '/login' },
]

function LinkColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--inv-muted)]">{title}</h3>
      <ul className="mt-4 grid gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex min-h-11 items-center"
            >
              <span className="link-draw">{link.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The site footer (dealt: footer-dark). On the home page it is also the close
 * (dealt: close-type) — pass `closing` with a title and a line and the footer
 * becomes one screen: the heading, the line and the big main-action button
 * across the wrap, then the links and the legal row.
 */
export default function Footer({ closing = null }) {
  const collections = useCollectionsMenu()
  const shopLinks = [{ name: 'All clothing', href: '/shop' }, ...collections]
  const helpLinks = [
    { name: 'Contact us', href: '/contact' },
    { name: 'Instagram', href: 'https://www.instagram.com/mac_dame/', external: true },
  ]

  return (
    <footer
      id="contact"
      className={`ground-inverse ${closing ? 'screen' : ''}`}
      style={closing ? { '--h': 1 } : undefined}
      aria-labelledby={closing ? 'close-h' : undefined}
    >
      <div className={`page-wrap flex flex-col ${closing ? 'flex-1 justify-between gap-16' : 'py-14'}`}>
        {closing && (
          <div>
            <h2 id="close-h" className="font-display t-h2 max-w-3xl">{closing.title}</h2>
            {closing.line && <p className="mt-4 t-lead text-[var(--inv-muted)] measure">{closing.line}</p>}
            <Link href="/shop" className="btn btn-primary btn-xl mt-10 w-full justify-between">
              Shop all clothing
              <Arrow />
            </Link>
          </div>
        )}

        <div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12">
            <div className="col-span-2 lg:col-span-5">
              <Link href="/" className="font-display text-3xl inline-flex min-h-11 items-center">MacDame</Link>
              <p className="mt-3 text-[var(--inv-muted)] measure">
                Kerala kasavu and handloom wear for women, men and children, sold online from Kerala.
              </p>
            </div>
            <div className="lg:col-start-7 lg:col-span-2"><LinkColumn title="Shop" links={shopLinks} /></div>
            <div className="lg:col-span-2"><LinkColumn title="Your account" links={accountLinks} /></div>
            <div className="lg:col-span-2"><LinkColumn title="Help" links={helpLinks} /></div>
          </div>
          <p className="mt-12 border-t border-[var(--inv-line)] pt-6 text-sm text-[var(--inv-muted)]">
            © {new Date().getFullYear()} MacDame · Kerala, India
          </p>
        </div>
      </div>
    </footer>
  )
}
