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
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const channels = [
  {
    icon: Phone,
    label: 'Call us',
    value: CONTACT.phone,
    sub: 'Mon–Sat, 10am – 7pm IST',
    href: CONTACT.phoneHref,
  },
  {
    icon: Mail,
    label: 'Email us',
    value: CONTACT.email,
    sub: 'We reply within a working day',
    href: `mailto:${CONTACT.email}`,
  },
  {
    icon: Instagram,
    label: 'Message us',
    value: CONTACT.instagram,
    sub: 'DMs open for quick questions',
    href: CONTACT.instagramHref,
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center max-w-2xl mx-auto mb-14"
            >
              <motion.span
                variants={item}
                className="text-sm font-semibold text-[var(--color-secondary)] tracking-wider uppercase"
              >
                We&apos;d love to hear from you
              </motion.span>
              <motion.h1
                variants={item}
                className="mt-2 text-4xl md:text-5xl font-bold text-[var(--color-primary-dark)]"
                style={serif}
              >
                Get in Touch
              </motion.h1>
              <motion.p variants={item} className="mt-4 text-lg text-gray-600 leading-relaxed">
                Questions about a saree, help with sizing, order updates or bulk
                uniform enquiries — reach us on whichever channel suits you best.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Contact channels */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="lg:col-span-2 space-y-4"
              >
                {channels.map((c) => (
                  <motion.a
                    key={c.label}
                    variants={item}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                      <c.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">{c.label}</p>
                      <p
                        className="text-lg font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-primary)] transition-colors duration-300 truncate"
                        style={serif}
                      >
                        {c.value}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                    </div>
                  </motion.a>
                ))}

                {/* Hours */}
                <motion.div
                  variants={item}
                  className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="w-11 h-11 shrink-0 rounded-full bg-[var(--color-secondary)]/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--color-secondary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Store hours</p>
                    <p className="text-lg font-semibold text-[var(--color-primary-dark)]" style={serif}>
                      Monday – Saturday
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      10:00 am – 7:00 pm IST · Closed on Sundays
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Message form */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="lg:col-span-3"
              >
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-xl p-6 md:p-8 shadow-sm space-y-5"
                >
                  <h2
                    className="text-2xl font-semibold text-[var(--color-primary-dark)]"
                    style={serif}
                  >
                    Send us a message
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="text-sm font-medium text-gray-700">
                        Your name
                      </label>
                      <Input
                        id="contact-name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Meera Nair"
                        required
                        className="h-11 focus-visible:ring-[var(--color-secondary)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                        className="h-11 focus-visible:ring-[var(--color-secondary)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <Textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what you're looking for — a festive saree, a set mundu for a wedding, school uniforms in bulk…"
                      required
                      rows={6}
                      className="resize-none focus-visible:ring-[var(--color-secondary)]"
                    />
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-[var(--color-cream)] px-8 font-semibold gap-2 transition-colors duration-300"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </Button>
                  </motion.div>

                  <p className="text-xs text-gray-400">
                    Submitting opens your email app with the message pre-filled — nothing is
                    sent until you hit send there.
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  )
}
