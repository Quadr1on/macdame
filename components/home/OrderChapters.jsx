'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { FULFILMENT_STEPS, orderStatusMeta } from '@/lib/order-status'

/**
 * The page's dealt moment: pinned-chapters (tasteskill moments.md).
 *
 * Live (from 1024px wide on a screen 640px or taller, without reduced motion)
 * the section is two screens tall; its stage sticks for one screen while the
 * three steps open one at a time on the left and the frame on the right
 * crossfades to each step's picture. At rest (phones, tablets, short screens,
 * reduced motion, before hydration) every step stands open with its picture,
 * so nothing depends on the script.
 */

function OrderTracker() {
  // The shop's own order view (app/account/orders), rebuilt as a still: the
  // real fulfilment stages from lib/order-status, one order part way through.
  const current = FULFILMENT_STEPS.indexOf('shipped')
  return (
    <div className="w-full max-w-[420px] rounded-xl bg-[var(--color-cream)] p-6 text-[var(--ink)] shadow-[0_1px_0_rgb(0_0_0/0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Your order</p>
          <p className="font-display text-2xl leading-tight">Kerala Kasavu Saree</p>
        </div>
        <p className="text-lg font-medium tabular-nums">₹2,499</p>
      </div>
      <ol className="mt-6 grid gap-3.5">
        {FULFILMENT_STEPS.map((step, i) => {
          const done = i < current
          const now = i === current
          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={`grid size-6 place-items-center rounded-full border ${
                  done
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-cream)]'
                    : now
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-[var(--line)] text-transparent'
                }`}
              >
                {done ? <Check className="size-3.5" strokeWidth={2.5} /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              <span className={now ? 'font-medium' : done ? '' : 'text-[var(--muted)]'}>
                {orderStatusMeta(step).label}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <p className="text-sm text-[var(--muted)]">Tracking ID</p>
        <p className="tabular-nums tracking-wide">EK 4071 2286 9IN</p>
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Pick a size and colour',
    body: 'Each product page lists the fabric, the weave, the sizes and the wash care. Sarees come in one free size.',
    // The source file has white bands down both edges; the 1.22 crop keeps them out of the frame.
    visual: { src: '/hero-banner.png', alt: 'A woman in a cream kasavu saree with a wide gold border on a wooden veranda', pos: '52% 30%', crop: 1.22 },
  },
  {
    title: 'Pay by UPI, card or net banking',
    body: 'Sign in with Google, pick a delivery address saved in your account, and pay through Razorpay.',
    visual: { src: '/product-kasavu-saree.png', alt: 'A folded cream kasavu saree with a gold zari border', pos: '50% 50%' },
  },
  {
    title: 'Follow the order to your door',
    body: 'Your account shows each order as it is confirmed, packed and shipped, with the tracking ID once it leaves.',
    visual: { tracker: true },
  },
]

function Visual({ visual, sizes }) {
  if (visual.tracker) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#2c1e15] p-6 sm:p-10">
        <OrderTracker />
      </div>
    )
  }
  return (
    <Image
      src={visual.src}
      alt={visual.alt}
      fill
      sizes={sizes}
      className="object-cover"
      style={{ objectPosition: visual.pos, scale: visual.crop ? String(visual.crop) : undefined }}
    />
  )
}

export default function OrderChapters() {
  const sectionRef = useRef(null)
  const [live, setLive] = useState(false)
  const [active, setActive] = useState(0)

  // Go live only where the pinned version fits and motion is welcome.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)')
    const update = () => setLive(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // While live, the scroll through the section's one held screen picks the step.
  useEffect(() => {
    if (!live) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = sectionRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const held = el.offsetHeight - window.innerHeight
        const p = held > 0 ? Math.min(1, Math.max(0, -rect.top / held)) : 0
        setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [live])

  const heading = (
    <div>
      <h2 id="ordering-h" className="font-display t-h2">How ordering works</h2>
      <p className="mt-3 text-[var(--inv-muted)] measure">
        Three steps from the product page to your door, all from your phone.
      </p>
    </div>
  )

  if (live) {
    return (
      <section
        ref={sectionRef}
        id="ordering"
        data-moment="pinned-chapters"
        aria-labelledby="ordering-h"
        className="ground-inverse relative"
        style={{ height: '200svh' }}
      >
        <div className="sticky top-0 h-svh overflow-clip pt-32 pb-16">
          <div className="page-wrap grid h-full grid-cols-12 gap-x-6">
            <div className="col-span-5 flex flex-col gap-10">
              {heading}
              <ol className="grid gap-6">
                {STEPS.map((step, i) => {
                  const on = i === active
                  return (
                    <li
                      key={step.title}
                      className={`border-l-2 pl-5 transition-[border-color] duration-300 ${on ? 'border-[var(--color-secondary)]' : 'border-[var(--inv-line)]'}`}
                    >
                      <h3 className={`text-xl font-medium transition-colors duration-300 ${on ? 'text-[var(--inv-ink)]' : 'text-[var(--inv-muted)]'}`}>
                        {step.title}
                      </h3>
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-[420ms] ease-[cubic-bezier(.2,.7,.2,1)]"
                        style={{ gridTemplateRows: on ? '1fr' : '0fr', opacity: on ? 1 : 0 }}
                      >
                        <p className="min-h-0 overflow-hidden pt-2 text-[var(--inv-ink)]/85 measure">{step.body}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
            <div className="relative col-start-7 col-span-6 h-full max-h-[708px] overflow-hidden">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  className="absolute inset-0 transition-[opacity,scale] duration-[480ms,900ms] ease-[ease,cubic-bezier(.16,1,.3,1)]"
                  style={{ opacity: i === active ? 1 : 0, scale: i === active ? '1' : '1.03', zIndex: i === active ? 1 : 0 }}
                >
                  <Visual visual={step.visual} sizes="50vw" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // At rest: every step open, each with its picture.
  return (
    <section
      ref={sectionRef}
      id="ordering"
      data-moment="pinned-chapters"
      aria-labelledby="ordering-h"
      className="ground-inverse screen"
      style={{ '--h': 1 }}
    >
      <div className="page-wrap flex flex-col gap-10">
        {heading}
        <ol className="grid gap-8 sm:gap-6">
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="grid gap-4 sm:grid-cols-2 sm:items-center sm:gap-6 sm:border-t sm:border-[var(--inv-line)] sm:pt-6"
            >
              <div>
                <h3 className="text-xl font-medium">{step.title}</h3>
                <p className="mt-2 text-[var(--inv-ink)]/85 measure">{step.body}</p>
              </div>
              <div className="relative aspect-video sm:aspect-[4/3] sm:max-h-[30svh] w-full overflow-hidden">
                <Visual visual={step.visual} sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
