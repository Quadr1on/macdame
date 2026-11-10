'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Arrow from './Arrow'
import { HOME_SLIDES } from '@/lib/hero-slides'

gsap.registerPlugin(useGSAP)

/*
 * The full-screen hero slideshow, split into two invisible halves. Used on the
 * home page (HOME_SLIDES, no visible title: the scroll logo stands in) and on
 * every shop page (their own slides from lib/hero-slides, with `title` set
 * large in the bottom-left corner). With a single slide it is a still photo:
 * no halves, cursor, counter or autoplay.
 *
 * - On a mouse, the cursor over the hero becomes a large cream circle whose
 *   arrow points at the half it is on; a click on the left half goes back, on
 *   the right half goes forward.
 * - The next slide wipes in from the side that was clicked, its photograph
 *   settling from a slight zoom while the old one drifts the other way.
 * - Touch: tap either half, or swipe. Keyboard: the halves are buttons, and the
 *   arrow keys work while the hero has focus.
 * - It also advances on its own every 6.5 s, paused while the pointer is over
 *   it, while the tab is hidden, and entirely under reduced motion.
 */

const INTERVAL = 6.5

export default function HeroSlideshow({ slides: SLIDES = HOME_SLIDES, title, subtitle, label = 'MacDame collections' }) {
  const multi = SLIDES.length > 1
  const root = useRef(null)
  const slideRefs = useRef([])
  const imgRefs = useRef([])
  const cursor = useRef(null)
  const cursorArrow = useRef(null)
  const progress = useRef(null)
  const captionRef = useRef(null)
  const state = useRef({ index: 0, busy: false, side: 1, swiped: false, startX: 0, startY: 0 })
  const timer = useRef(null)
  const [index, setIndex] = useState(0)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setReduced(mq.matches)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])

  const { contextSafe } = useGSAP({ scope: root })

  // Move to the slide `dir` steps away (1 forward, -1 back).
  const go = contextSafe((dir) => {
    const s = state.current
    if (s.busy || SLIDES.length < 2) return
    const n = SLIDES.length
    const from = s.index
    const to = (from + dir + n) % n
    const outEl = slideRefs.current[from]
    const inEl = slideRefs.current[to]
    const outImg = imgRefs.current[from]
    const inImg = imgRefs.current[to]
    const inCrop = SLIDES[to].crop || 1
    const outCrop = SLIDES[from].crop || 1
    s.busy = true
    s.index = to
    setIndex(to)

    gsap.set(slideRefs.current, { zIndex: 0 })
    gsap.set(outEl, { zIndex: 1, autoAlpha: 1 })
    gsap.set(inEl, { zIndex: 2, autoAlpha: 1 })

    const done = () => {
      gsap.set(outEl, { autoAlpha: 0, clipPath: 'inset(0% 0% 0% 0%)' })
      gsap.set(outImg, { xPercent: 0, scale: outCrop })
      s.busy = false
    }

    if (reduced) {
      gsap.fromTo(inEl, { autoAlpha: 0, clipPath: 'inset(0% 0% 0% 0%)' }, { autoAlpha: 1, duration: 0.35, ease: 'none', onComplete: done })
      gsap.set(inImg, { scale: inCrop, xPercent: 0 })
      return
    }

    const tl = gsap.timeline({ defaults: { duration: 1.15, ease: 'expo.inOut' }, onComplete: done })
    tl.fromTo(
      inEl,
      { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)' },
      0
    )
      .fromTo(inImg, { scale: inCrop * 1.14, xPercent: 6 * dir }, { scale: inCrop, xPercent: 0, duration: 1.5, ease: 'expo.out' }, 0.15)
      .to(outImg, { xPercent: -10 * dir, scale: outCrop * 1.04 }, 0)
  })

  // The caption lines rise in for each slide.
  useGSAP(
    () => {
      if (!captionRef.current) return
      gsap.fromTo(
        captionRef.current.querySelectorAll('[data-rise]'),
        { yPercent: 110, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: reduced ? 0.01 : 0.9, ease: 'expo.out', stagger: 0.07, delay: reduced ? 0 : 0.35 }
      )
    },
    { scope: root, dependencies: [index, reduced] }
  )

  // Autoplay with a progress line, paused on hover, hidden tabs and reduced motion.
  const paused = hoverPaused || reduced || !multi
  useGSAP(
    () => {
      timer.current?.kill()
      if (!progress.current) return
      gsap.set(progress.current, { scaleX: 0 })
      if (paused) return
      timer.current = gsap.to(progress.current, {
        scaleX: 1,
        duration: INTERVAL,
        ease: 'none',
        onComplete: () => go(1),
      })
      const onVis = () => (document.hidden ? timer.current?.pause() : timer.current?.resume())
      document.addEventListener('visibilitychange', onVis)
      return () => document.removeEventListener('visibilitychange', onVis)
    },
    { scope: root, dependencies: [index, paused] }
  )

  // The cursor circle follows the pointer with a little lag.
  const moveTo = useRef(null)
  useGSAP(
    () => {
      if (!cursor.current) return
      gsap.set(cursor.current, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.6 })
      moveTo.current = {
        x: gsap.quickTo(cursor.current, 'x', { duration: 0.45, ease: 'power3.out' }),
        y: gsap.quickTo(cursor.current, 'y', { duration: 0.45, ease: 'power3.out' }),
      }
    },
    { scope: root }
  )

  const onPointerMove = contextSafe((e) => {
    if (e.pointerType !== 'mouse' || !moveTo.current) return
    const rect = root.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    moveTo.current.x(x)
    moveTo.current.y(y)
    const side = x < rect.width / 2 ? -1 : 1
    if (side !== state.current.side) {
      state.current.side = side
      gsap.to(cursorArrow.current, { rotation: side < 0 ? 180 : 0, duration: 0.5, ease: 'expo.out' })
    }
  })

  const showCursor = contextSafe((e) => {
    if (e.pointerType !== 'mouse') return
    const rect = root.current.getBoundingClientRect()
    gsap.set(cursor.current, { x: e.clientX - rect.left, y: e.clientY - rect.top })
    state.current.side = e.clientX - rect.left < rect.width / 2 ? -1 : 1
    gsap.set(cursorArrow.current, { rotation: state.current.side < 0 ? 180 : 0 })
    gsap.to(cursor.current, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'expo.out' })
  })
  const hideCursor = contextSafe(() => {
    gsap.to(cursor.current, { autoAlpha: 0, scale: 0.6, duration: 0.3, ease: 'power2.out' })
  })
  const pressCursor = contextSafe(() => {
    gsap.fromTo(cursor.current, { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'expo.out' })
  })

  // Swipe on touch. A horizontal swipe also counts as the tap that follows it,
  // so the next click is swallowed.
  const onPointerDown = (e) => {
    state.current.startX = e.clientX
    state.current.startY = e.clientY
    state.current.swiped = false
  }
  const onPointerUp = (e) => {
    if (e.pointerType === 'mouse') return
    const dx = e.clientX - state.current.startX
    const dy = e.clientY - state.current.startY
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      state.current.swiped = true
      go(dx < 0 ? 1 : -1)
    }
  }
  const onZone = (dir) => () => {
    if (state.current.swiped) {
      state.current.swiped = false
      return
    }
    go(dir)
  }

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    },
    [go]
  )

  const slide = SLIDES[index]

  return (
    <section
      id="hero"
      ref={root}
      className="relative h-svh min-h-[560px] touch-pan-y overflow-hidden bg-[var(--color-primary-dark)]"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHoverPaused(true)
      }}
      onPointerLeave={() => {
        setHoverPaused(false)
        hideCursor()
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {!title && <h1 className="sr-only">MacDame: kasavu and handloom wear from Kerala</h1>}

      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          ref={(el) => (slideRefs.current[i] = el)}
          className={`absolute inset-0 overflow-hidden ${i === 0 ? 'hero-curtain' : ''}`}
          style={{ visibility: i === 0 ? 'visible' : 'hidden', zIndex: i === 0 ? 1 : 0 }}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${SLIDES.length}: ${s.name}`}
        >
          <div ref={(el) => (imgRefs.current[i] = el)} className="absolute inset-0" style={{ scale: String(s.crop || 1) }}>
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              quality={90}
              sizes="100vw"
              className="object-cover object-[var(--pos-phone)] md:object-[var(--pos)]"
              style={{ '--pos': s.pos, '--pos-phone': s.posPhone }}
            />
          </div>
        </div>
      ))}

      {/* A soft shade at the foot keeps the caption readable on any photograph. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[46%] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

      {/* The two invisible halves (only when there is more than one slide) */}
      {multi && (<>
      <div className="absolute inset-0 z-10 grid grid-cols-2">
        {[-1, 1].map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={onZone(dir)}
            onPointerEnter={showCursor}
            onPointerMove={onPointerMove}
            onPointerDown={(e) => e.pointerType === 'mouse' && pressCursor()}
            className="h-full w-full [@media(hover:hover)_and_(pointer:fine)]:cursor-none outline-none focus-visible:outline-2 focus-visible:outline-offset-[-12px] focus-visible:outline-white"
            aria-label={dir < 0 ? 'Previous slide' : 'Next slide'}
          />
        ))}
      </div>

      {/* The cursor circle (mouse only) */}
      <div
        ref={cursor}
        aria-hidden="true"
        // A transparent ring with a white outline and a white arrow. The faint
        // drop shadow keeps it visible over the brightest parts of a photo.
        className="pointer-events-none absolute left-0 top-0 z-30 hidden size-[30px] place-items-center rounded-full border border-white text-white [filter:drop-shadow(0_1px_6px_rgb(0_0_0/0.35))] [@media(hover:hover)_and_(pointer:fine)]:grid"
      >
        <span ref={cursorArrow} className="grid place-items-center">
          <Arrow className="size-4" />
        </span>
      </div>
      </>)}

      {/* Caption, controls and progress, bottom right */}
      <div
        className={`page-wrap pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-6 pb-6 md:flex-row md:items-end md:pb-10 ${title ? "md:justify-between" : "md:justify-end"}`}
      >
        {/* A visible page title, bottom left (collection and shop pages) */}
        {title && (
          <div className="pointer-events-auto text-white" onPointerEnter={hideCursor}>
            <h1 className="font-display text-[clamp(56px,7vw+12px,132px)] leading-[0.95] tracking-[-0.02em] [text-wrap:balance]">{title}</h1>
            {subtitle && <p className="mt-3 text-white/80">{subtitle}</p>}
          </div>
        )}
        <div
          ref={captionRef}
          className="pointer-events-auto w-full max-w-sm text-white md:w-auto md:min-w-[22rem]"
          onPointerEnter={hideCursor}
          aria-live="polite"
        >
          {multi && <div className="overflow-hidden">
            <p data-rise className="text-sm text-white/75 tabular-nums">
              {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </p>
          </div>}
          <div className="overflow-hidden">
            <p data-rise className="font-display text-[clamp(30px,2.4vw+12px,44px)] leading-[1.1]">{slide.name}</p>
          </div>
          <div className="overflow-hidden">
            <p data-rise className="mt-1 hidden text-white/85 md:block">{slide.line}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <Link href={slide.href} className="btn bg-[var(--color-cream)] text-[var(--ink)] hover:bg-white">
              {slide.cta}
              <Arrow />
            </Link>
            {multi && <div className="flex items-center gap-1 [@media(hover:hover)_and_(pointer:fine)]:hidden">
              <button type="button" onClick={() => go(-1)} className="grid size-11 place-items-center rounded-full border border-white/50" aria-label="Previous slide">
                <Arrow className="size-4 rotate-180" />
              </button>
              <button type="button" onClick={() => go(1)} className="grid size-11 place-items-center rounded-full border border-white/50" aria-label="Next slide">
                <Arrow className="size-4" />
              </button>
            </div>}
          </div>

          {multi && <div className="mt-5 h-px w-full bg-white/30" aria-hidden="true">
            <div ref={progress} className="h-px w-full origin-left bg-white" />
          </div>}
        </div>
      </div>
    </section>
  )
}
