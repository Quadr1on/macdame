import Image from 'next/image'
import Link from 'next/link'
import Arrow from './Arrow'

const inr = (n) => `₹${n.toLocaleString('en-IN')}`

/**
 * A lookbook diptych, after the fashion-label heroes on Awwwards (Almada Label,
 * Deadly Ponies): the first screen is two full-height photographs of the
 * clothes, edge to edge, split by the same 10px gap the collections grid uses.
 * The words stay small and sit on a slim cream row at the foot, so nothing is
 * printed over a photograph and the fabric does the talking.
 *
 * Left: the kasavu worn, the whole figure. Right: a silk saree draped on its
 * stand. Both open once on load with a curtain reveal from the bottom.
 */
export default function HomeHero({ floors = {} }) {
  const facts = [
    floors.women && `Women's wear from ${inr(floors.women)}`,
    floors.kids && `children's from ${inr(floors.kids)}`,
  ].filter(Boolean)

  return (
    <section
      className="relative flex h-svh min-h-[600px] flex-col pt-20"
      aria-labelledby="hero-h"
    >
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        <div className="hero-curtain relative overflow-hidden bg-[var(--color-cream-dark)]">
          {/* The source file carries white bands down both edges; the 1.3
              crop keeps them out of the frame. */}
          <Image
            src="/hero-banner.png"
            alt="A woman in a cream kasavu saree with a wide gold border, standing on a wooden veranda"
            fill
            priority
            sizes="50vw"
            className="object-cover"
            style={{ objectPosition: '50% 22%', scale: '1.3' }}
          />
        </div>
        <div className="hero-curtain relative overflow-hidden bg-[var(--color-cream-dark)]" style={{ '--d': '140ms' }}>
          <Image
            src="/product-bridal-saree.png"
            alt="A cream silk saree with a woven gold border, draped on a wooden stand"
            fill
            priority
            sizes="50vw"
            className="object-cover"
            style={{ objectPosition: '50% 45%' }}
          />
        </div>
      </div>

      <div className="page-wrap enter grid gap-x-6 gap-y-4 py-6 lg:grid-cols-12 lg:items-end lg:py-8">
        <div className="lg:col-span-8" style={{ '--d': '420ms' }}>
          <h1 id="hero-h" className="font-display text-[clamp(30px,2.2vw+14px,46px)] leading-[1.08] tracking-[-0.01em] text-[var(--ink)]">
            Kasavu and handloom wear from Kerala
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Sarees, mundus and pattu pavadais in handloom cotton and silk.
            {facts.length > 0 && ` ${facts.join(', ')}.`}
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-2 lg:col-span-4 lg:justify-end"
          style={{ '--d': '500ms' }}
        >
          <Link href="/collections/women" className="btn btn-link text-[var(--ink)]">
            See kasavu sarees
          </Link>
          <Link href="/shop" className="btn btn-primary order-first lg:order-none">
            Shop all clothing
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  )
}
