'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import ProductCard from '@/components/ProductCard'
import { Slider } from '@/components/ui/slider'
import { useCollectionsMenu } from '@/lib/collections-menu'

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

/**
 * The browsing half of every shop page (all clothing and each collection):
 * collection tabs, an inline price filter and the product grid, on the same
 * wrap, type and cream ground as the home page. The price ceiling follows the
 * catalogue rather than a hard-coded ₹20,000.
 */
export default function ProductBrowser({ products = [], activeSlug = null, heading, intro }) {
  const collections = useCollectionsMenu()
  const ceiling = useMemo(() => {
    const top = Math.max(0, ...products.map((p) => p.price))
    return Math.max(1000, Math.ceil(top / 1000) * 1000)
  }, [products])
  const [range, setRange] = useState([0, ceiling])
  const [lo, hi] = [range[0], Math.min(range[1], ceiling)]

  const shown = useMemo(() => products.filter((p) => p.price >= lo && p.price <= hi), [products, lo, hi])
  const filtering = lo > 0 || hi < ceiling
  const clear = () => setRange([0, ceiling])

  const tabs = [{ name: 'All clothing', href: '/shop', slug: null }, ...collections]

  return (
    <MotionConfig reducedMotion="user">
      <section id="pieces" className="scroll-mt-16 py-16 lg:py-24" aria-labelledby="pieces-h">
        <div className="page-wrap">
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end lg:gap-x-6">
            <h2 id="pieces-h" className="font-display t-h2 text-[var(--ink)] lg:col-span-6">
              {heading}
            </h2>
            {intro && <p className="text-[var(--muted)] lg:col-start-7 lg:col-span-5">{intro}</p>}
          </div>

          {/* Collection tabs */}
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Collections">
            {tabs.map((tab) => {
              const active = tab.slug === activeSlug
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex h-11 items-center rounded-full border px-5 text-[15px] font-medium transition-colors duration-200 ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--color-cream)]'
                      : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
                  }`}
                >
                  {tab.name}
                </Link>
              )
            })}
          </nav>

          {/* Filter bar */}
          {products.length > 1 && (
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-[var(--line)] py-4">
              <div className="flex w-full items-center gap-4 sm:w-auto">
                <span className="text-sm font-medium text-[var(--ink)]">Price</span>
                <Slider
                  value={[lo, hi]}
                  onValueChange={setRange}
                  min={0}
                  max={ceiling}
                  step={100}
                  className="w-full sm:w-64"
                  aria-label="Price range"
                />
                <span className="whitespace-nowrap text-sm tabular-nums text-[var(--muted)]">
                  {inr(lo)} – {inr(hi)}
                </span>
              </div>
              {filtering && (
                <button type="button" onClick={clear} className="h-11 text-sm font-medium text-[var(--color-primary)] underline underline-offset-4">
                  Clear price
                </button>
              )}
              <p className="text-sm text-[var(--muted)] sm:ml-auto" aria-live="polite">
                Showing <span className="font-medium text-[var(--ink)] tabular-nums">{shown.length}</span> of {products.length}
              </p>
            </div>
          )}

          {/* Grid */}
          {shown.length > 0 ? (
            <motion.div layout className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {shown.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="mt-8 flex flex-col items-start gap-4 border border-dashed border-[var(--line)] p-10">
              <h3 className="font-display t-h3 text-[var(--ink)]">
                {products.length ? 'No pieces in that price range' : 'Pieces for this collection are on their way'}
              </h3>
              <p className="text-[var(--muted)] measure">
                {products.length
                  ? 'Widen the price range to see the rest of the collection.'
                  : 'Nothing is listed here yet. The rest of the shop is open in the meantime.'}
              </p>
              {products.length ? (
                <button type="button" onClick={clear} className="btn btn-primary">Show every price</button>
              ) : (
                <Link href="/shop" className="btn btn-primary">Shop all clothing</Link>
              )}
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  )
}
