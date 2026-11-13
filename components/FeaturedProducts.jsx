import Link from 'next/link'
import ProductCard from './ProductCard'
import Arrow from './home/Arrow'

/**
 * Bestsellers: the featured products from the database, four across, with a
 * head row on the page's left line and its one link on the right.
 */
export default function FeaturedProducts({ products = [], totalCount = 0 }) {
  if (products.length === 0) return null

  return (
    <section id="bestsellers" className="screen" style={{ '--h': 1 }} aria-labelledby="bestsellers-h">
      <div className="page-wrap">
        <div className="mb-8 lg:mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-2xl">
            <h2 id="bestsellers-h" className="font-display t-h2 text-[var(--ink)]">
              Bestselling sarees and mundus
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Every piece lists its fabric, weave and wash care on its own page.
            </p>
          </div>
          {totalCount > 0 && (
            <Link href="/shop" className="group inline-flex items-center gap-2 py-3 font-medium text-[var(--ink)]">
              <span className="link-draw">See all {totalCount} pieces</span>
              <Arrow className="size-3.5 transition-[translate] duration-200 group-hover:translate-x-[3px]" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
