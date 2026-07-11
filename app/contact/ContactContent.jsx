'use client'
import { useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, Instagram, Clock, Send } from 'lucide-react'

const serif = { fontFamily: 'var(--font-playfair), Georgia, serif' }

// Contact identity used across the site (footer + here). The phone number is
// still the launch placeholder — swap it for the real business line before
// going live. Instagram is the brand's real handle.
const CONTACT = {
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  email: 'hello@macdame.com',
  instagram: '@mac_dame',
  instagramHref: 'https://www.instagram.com/mac_dame/',
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// Flat tinted icon tiles — one brand hue each, no gradients.
const channels = [
  {
    icon: Phone,
    label: 'Phone',
    value: CONTACT.phone,
    href: CONTACT.phoneHref,
    tile: 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary-dark)]',
  },
  {
    icon: Mail,
    label: 'Our Email',
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    tile: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: CONTACT.instagram,
    href: CONTACT.instagramHref,
    tile: 'bg-[var(--color-terracotta)]/10 text-[var(--color-terracotta)]',
  },
  {
    icon: Clock,
    label: 'Store Hours',
    value: 'Mon–Sat, 10am – 7pm',
    tile: 'bg-[var(--color-cream-dark)] text-[var(--color-primary-dark)]',
  },
]

export default function ContactContent() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  // No backend inbox yet — hand the message to the visitor's mail app,
  // addressed to the shop, with everything pre-filled.
  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Website enquiry from ${form.name || 'a customer'}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`)
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--color-cream)]">
        <Navbar />

        <main className="pt-28 md:pt-32 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* One containing panel, two columns of equal height */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch"
            >
              {/* Left: heading + 2x2 info cards */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="flex flex-col"
              >
                <motion.h1
                  variants={item}
                  className="text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)]"
                  style={serif}
                >
                  Contact Us
                </motion.h1>
                <motion.p variants={item} className="mt-3 text-[15px] leading-relaxed text-gray-600 max-w-md">
                  Questions about a saree, help with sizing, order updates or bulk
                  uniform enquiries — reach us on whichever channel suits you best.
                </motion.p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-stretch">
                  {channels.map((c) => {
                    const CardTag = c.href ? motion.a : motion.div
                    return (
                      <CardTag
                        key={c.label}
                        variants={item}
                        {...(c.href
                          ? {
                              href: c.href,
                              target: c.href.startsWith('http') ? '_blank' : undefined,
                              rel: c.href.startsWith('http') ? 'noopener noreferrer' : undefined,
                              whileHover: { y: -2 },
                              whileTap: { scale: 0.99 },
                            }
                          : {})}
                        className={`group flex flex-col justify-center gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-[border-color,box-shadow] duration-300 ${
                          c.href ? 'hover:border-[var(--color-secondary)]/50 hover:shadow-md' : ''
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.tile}`}
                        >
                          <c.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{c.label}</p>
                          <p className="mt-0.5 text-sm text-gray-600 truncate group-hover:text-[var(--color-primary)] transition-colors duration-300">
                            {c.value}
                          </p>
                        </div>
                      </CardTag>
                    )
                  })}
                </div>
              </motion.div>

              {/* Right: message form, same height as the left column */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form
                  onSubmit={handleSubmit}
                  className="h-full flex flex-col gap-5 rounded-2xl bg-[var(--color-cream)]/70 border border-[var(--color-cream-dark)] p-6 md:p-7"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-sm font-semibold text-gray-900">
                      Full Name
                    </label>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      autoComplete="name"
                      required
                      className="h-11 bg-white placeholder:text-gray-500 focus-visible:ring-[var(--color-secondary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-sm font-semibold text-gray-900">
                      Email address
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      required
                      className="h-11 bg-white placeholder:text-gray-500 focus-visible:ring-[var(--color-secondary)]"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label htmlFor="contact-message" className="text-sm font-semibold text-gray-900">
                      About your enquiry
                    </label>
                    <Textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Enter your message"
                      required
                      className="flex-1 min-h-28 resize-none bg-white placeholder:text-gray-500 focus-visible:ring-[var(--color-secondary)]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] active:scale-[0.99] text-[var(--color-cream)] font-semibold gap-2 transition-[background-color,transform] duration-300"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </Button>

                  <p className="text-xs text-gray-500 -mt-2">
                    Submitting opens your email app with the message pre-filled.
                  </p>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  )
}
