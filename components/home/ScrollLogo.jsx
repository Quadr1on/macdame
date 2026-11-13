'use client'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/*
 * The scroll logo, after zeyraglow.com: one large MacDame mark fixed to the
 * bottom-left corner of the hero. As the hero scrolls away the mark scrubs
 * down in step with the scroll; on a desktop it then stays pinned in the
 * corner for the rest of the page.
 *
 * It is two stacked copies of the logo: a white one clipped to whatever part
 * of it still sits over the hero photograph, and the brand's own gold one
 * clipped to the part over the cream page, so the colour changes exactly where
 * the hero's edge crosses the letters.
 *
 * On a phone a pinned corner mark would sit on top of the products, so there
 * it fades away as the hero leaves and the navbar logo takes over.
 */
export default function ScrollLogo() {
  const wrap = useRef(null)
  const white = useRef(null)
  const gold = useRef(null)

  useGSAP(() => {
    const hero = document.getElementById('hero')
    if (!hero || !wrap.current) return

    const mm = gsap.matchMedia()
    mm.add(
      {
        desktop: '(min-width: 1024px)',
        phone: '(max-width: 1023px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const { desktop, reduce } = ctx.conditions
        const big = wrap.current.offsetWidth
        const small = desktop ? 150 : 110

        gsap.fromTo(
          wrap.current,
          { scale: 1 },
          {
            scale: small / big,
            ease: 'none',
            // Done shrinking a quarter-screen before the hero leaves, so the
            // mark is already small when the next section's heading arrives.
            scrollTrigger: { trigger: hero, start: 'top top', end: '75% top', scrub: reduce ? true : 0.8 },
          }
        )

        if (!desktop) {
          gsap.fromTo(
            wrap.current,
            { autoAlpha: 1 },
            {
              autoAlpha: 0,
              ease: 'none',
              scrollTrigger: { trigger: hero, start: '55% top', end: '90% top', scrub: true },
            }
          )
        }
      }
    )

    // Split the colour where the hero's bottom edge crosses the mark.
    const split = () => {
      if (!wrap.current) return
      const heroBottom = hero.getBoundingClientRect().bottom
      const r = wrap.current.getBoundingClientRect()
      const over = Math.min(1, Math.max(0, (heroBottom - r.top) / r.height)) * 100
      white.current.style.clipPath = `inset(0 0 ${100 - over}% 0)`
      gold.current.style.clipPath = `inset(${over}% 0 0 0)`
    }
    split()
    gsap.ticker.add(split)

    return () => {
      gsap.ticker.remove(split)
      mm.revert()
    }
  })

  const toTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      ref={wrap}
      // On a phone it sits above the slide caption; on a desktop in the corner.
      className="pointer-events-none fixed bottom-[188px] left-6 z-40 w-[50vw] max-w-[300px] origin-bottom-left sm:left-12 md:bottom-[220px] lg:bottom-6 lg:w-[34vw] lg:max-w-[520px] xl:left-20"
      style={{ aspectRatio: '1536 / 1024' }}
    >
      <button
        type="button"
        onClick={toTop}
        className="pointer-events-auto absolute inset-[18%_8%] rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-secondary)]"
        aria-label="MacDame, back to top"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={white} src="/macdame.png" alt="" className="absolute inset-0 h-full w-full object-contain brightness-0 invert" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={gold} src="/macdame.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: 'inset(100% 0 0 0)' }} />
    </div>
  )
}
