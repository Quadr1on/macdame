import Image from 'next/image'
import Link from 'next/link'
import Arrow from './Arrow'

/**
 * Full-screen image hero, after the fashion heroes on Awwwards that let one
 * photograph take the whole first screen (Morrow, Seed Jewelry): the kasavu,
 * the jhumka and the temple necklace, edge to edge, with the navbar laid over
 * it. No headline banner — the h1 stays for screen readers and search, and the
 * only things on the photograph are one button and a scroll cue at the foot.
 */
export default function HomeHero() {
  return (
    <section className="relative h-svh min-h-[560px] overflow-hidden bg-[var(--color-primary-dark)]" aria-labelledby="hero-h">
      <h1 id="hero-h" className="sr-only">MacDame: kasavu and handloom wear from Kerala</h1>

      <div className="hero-curtain absolute inset-0">
        <Image
          src="/hero-fullwidth.png"
          alt="A woman in a cream kasavu saree with a gold and magenta border, temple jewellery and jasmine in her hair"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[42%_50%] md:object-[50%_30%]"
        />
      </div>

      <div className="page-wrap enter absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 pb-8 md:pb-10">
        <Link
          href="/shop"
          className="btn bg-[var(--color-cream)] text-[var(--ink)] hover:bg-white"
          style={{ '--d': '600ms' }}
        >
          Shop the collection
          <Arrow />
        </Link>
        <a
          href="#collections"
          className="hidden md:inline-flex size-11 items-center justify-center rounded-full border border-white/50 text-white transition-colors duration-200 hover:bg-white/10"
          aria-label="Scroll to the collections"
          style={{ '--d': '700ms' }}
        >
          <Arrow className="size-3.5 rotate-90" />
        </a>
      </div>
    </section>
  )
}
