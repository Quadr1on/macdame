import Image from 'next/image'
import Link from 'next/link'
import Arrow from './Arrow'

const inr = (n) => `₹${n.toLocaleString('en-IN')}`

/**
 * The dealt `product` hero: a head row on the page ground (the h1 on columns
 * 1-7, the lead and the actions on 9-12 with their foot on the h1's), then the
 * clothing itself as a photograph running edge to edge down to the fold. No
 * words sit on the photograph, so it needs no scrim.
 */
export default function HomeHero({ floors = {} }) {
  const facts = [
    floors.women && `Women's wear from ${inr(floors.women)}`,
    floors.kids && `children's from ${inr(floors.kids)}`,
  ].filter(Boolean)

  return (
    <section className="screen !pb-0" style={{ '--h': 1 }} aria-labelledby="hero-h">
      <div className="page-wrap enter grid gap-y-5 lg:grid-cols-12 lg:gap-x-6 lg:items-end">
        <h1
          id="hero-h"
          className="font-display t-h1 text-[var(--ink)] lg:col-span-7 lg:row-span-2 lg:self-end"
          style={{ '--d': '0ms' }}
        >
          Kasavu and handloom wear from Kerala
        </h1>
        <p
          className="t-lead text-[var(--muted)] lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:self-end"
          style={{ '--d': '90ms' }}
        >
          Sarees, mundus and pattu pavadais for women, men and children, in handloom cotton and
          silk.{facts.length > 0 && ` ${facts.join(', ')}.`}
        </p>
        <div
          className="flex flex-wrap items-center gap-2 lg:col-start-9 lg:col-span-4 lg:row-start-2"
          style={{ '--d': '160ms' }}
        >
          <Link href="/shop" className="btn btn-primary">
            Shop all clothing
            <Arrow />
          </Link>
          <Link href="/collections/women" className="btn btn-link text-[var(--ink)]">
            See kasavu sarees
          </Link>
        </div>
      </div>

      <div className="relative mt-8 lg:mt-12 flex-1 min-h-[260px] overflow-hidden">
        <Image
          src="/hero-fullwidth.png"
          alt="A woman in a cream kasavu saree with a gold border and temple jewellery, standing beside a tree"
          fill
          priority
          sizes="100vw"
          className="object-cover enter-photo"
          style={{ objectPosition: '50% 30%' }}
        />
      </div>
    </section>
  )
}
