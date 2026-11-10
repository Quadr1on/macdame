import Image from 'next/image'
import Link from 'next/link'
import Arrow from './Arrow'

/**
 * One feature, one claim, shown in the photographs: the woven zari border.
 * Composition `tall-small` (tasteskill sections.md): a tall photograph on the
 * left six columns; on columns 8-12 the heading, its lines and link at the top
 * and a square detail at the bottom, its foot level with the tall one's.
 */
export default function KasavuFeature() {
  return (
    <section id="kasavu" className="screen" style={{ '--h': 1 }} aria-labelledby="kasavu-h">
      <div className="page-wrap grid flex-1 gap-8 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-start-7 lg:col-span-5 lg:row-start-1 flex flex-col">
          <h2 id="kasavu-h" className="font-display t-h2 text-[var(--ink)]">
            Handloom cotton with a woven gold border
          </h2>
          <p className="mt-4 text-[var(--muted)] measure">
            Kasavu sarees and mundus are pure handloom cotton, with the zari border woven into the
            cloth. The silk sarees are Kanchipuram, Mysore, Banarasi and Paithani silk.
          </p>
          <Link href="/collections/men" className="group mt-6 inline-flex w-fit items-center gap-2 py-3 font-medium text-[var(--ink)]">
            <span className="link-draw">See kasavu mundus</span>
            <Arrow className="size-3.5 transition-[translate] duration-200 group-hover:translate-x-[3px]" />
          </Link>

          <Link
            href="/collections/men"
            className="group relative mt-8 lg:mt-auto block aspect-square w-full max-w-[302px] overflow-hidden"
            aria-label="Kasavu mundus"
          >
            <Image
              src="/product-set-mundu.png"
              alt="A folded cream mundu with a broad gold zari border"
              fill
              sizes="302px"
              className="object-cover photo-zoom"
            />
          </Link>
        </div>

        <Link
          href="/collections/women"
          className="group relative block aspect-[4/5] lg:aspect-auto lg:h-full lg:max-h-[708px] lg:col-span-6 lg:row-start-1 overflow-hidden bg-[var(--color-cream-dark)]"
          aria-label="Silk sarees"
        >
          <Image
            src="/product-bridal-saree.png"
            alt="A cream silk saree with a wide woven gold border, draped on a wooden stand"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover photo-zoom"
            style={{ objectPosition: '50% 40%' }}
          />
        </Link>
      </div>
    </section>
  )
}
