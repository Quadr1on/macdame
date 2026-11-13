import Image from 'next/image'
import Link from 'next/link'
import Arrow from './home/Arrow'

/**
 * Bento sizing for an arbitrary number of collections.
 *
 * The grid is 3 columns. The first tile takes a 2x2 block, so the two single
 * cells beside it are filled by tiles 1 and 2 — a perfect 3-column, 2-row
 * rectangle for the common 3-collection case. Everything after that flows three
 * per row, and the final tile stretches to close whatever gap the remainder
 * leaves, so a new collection added in /admin never punches a hole in the grid.
 */
function gridClassFor(index, total) {
  if (total === 1) return 'md:col-span-3 md:row-span-2'
  if (total === 2) return index === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-2'
  if (index === 0) return 'md:col-span-2 md:row-span-2'

  const isLast = index === total - 1
  if (isLast) {
    const remainder = (total - 3) % 3
    if (remainder === 1) return 'md:col-span-3'
    if (remainder === 2) return 'md:col-span-2'
  }

  return 'md:col-span-1 md:row-span-1'
}

const pieces = (n) => `${n} ${n === 1 ? 'piece' : 'pieces'}`

/**
 * The range: every collection from the database as a photograph tile. The
 * name sits on an opaque cream plate inside the tile rather than on a gradient
 * scrim, so it stays readable over any photograph.
 */
export default function Collections({ collections = [] }) {
  if (collections.length === 0) return null

  return (
    <section id="collections" className="screen" style={{ '--h': 1 }} aria-labelledby="collections-h">
      <div className="page-wrap flex flex-1 flex-col">
        <div className="mb-8 lg:mb-10 grid gap-3 lg:grid-cols-12 lg:gap-x-6 lg:items-end">
          <h2 id="collections-h" className="font-display t-h2 text-[var(--ink)] lg:col-span-6">
            Collections for women, men and children
          </h2>
          <p className="text-[var(--muted)] lg:col-start-7 lg:col-span-5">
            Kasavu for festivals and weddings, everyday mundus, and uniforms for schools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 auto-rows-[220px] md:auto-rows-[180px] md:flex-1">
          {collections.map((collection, index) => {
            const isFeature = index === 0
            return (
              <Link
                key={collection.slug}
                href={collection.href}
                className={`${gridClassFor(index, collections.length)} group relative block overflow-hidden rounded-none bg-[var(--color-cream-dark)]`}
              >
                {collection.image && (
                  <Image
                    src={collection.image}
                    alt=""
                    fill
                    className="object-cover photo-zoom"
                    sizes={isFeature ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                  />
                )}

                <div className="absolute left-3 bottom-3 right-3 sm:right-auto flex items-center gap-6 bg-[var(--color-cream)] px-4 py-3 text-[var(--ink)]">
                  <div>
                    <h3 className={`font-display leading-tight ${isFeature ? 't-h3' : 'text-xl'}`}>
                      {collection.name}
                    </h3>
                    {collection.itemCount > 0 && (
                      <p className="text-sm text-[var(--muted)]">{pieces(collection.itemCount)}</p>
                    )}
                  </div>
                  <span className="ml-auto sm:ml-0 grid size-9 place-items-center rounded-full border border-[var(--line)] transition-[background-color,border-color,color] duration-200 group-hover:border-[var(--ink)] group-hover:bg-[var(--ink)] group-hover:text-[var(--color-cream)]">
                    <Arrow className="size-3.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
