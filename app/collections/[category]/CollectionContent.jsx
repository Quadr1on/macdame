'use client'
import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useScroll,
  useTransform,
} from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Slider } from '@/components/ui/slider'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'

const serif = { fontFamily: 'var(--font-playfair), Georgia, serif' }

const MIN_PRICE = 0
const MAX_PRICE = 20000

// "Men" -> "Men's", but "Kids" -> "Kids'" (names already ending in s)
const possessive = (name) => (name.endsWith('s') ? `${name}'` : `${name}'s`)

// Entrance choreography for the hero copy
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}
const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function CollectionContent({ category, products }) {
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE])
  const heroRef = useRef(null)

  // Gentle parallax: the hero image drifts and softens as you scroll past it
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    )
  }, [products, priceRange])

  const handleClearFilters = () => setPriceRange([MIN_PRICE, MAX_PRICE])
  const hasActiveFilters = priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--color-cream)]">
        <Navbar />

        <main className="pb-16">
          {/* ---- Category Hero ---- */}
          <section
            ref={heroRef}
            className="relative h-[54vh] min-h-[400px] overflow-hidden"
          >
            <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0">
              <Image
                src={category.image || '/collection-sarees.png'}
                alt={category.name}
                fill
                priority
                className="object-cover object-center"
              />
            </motion.div>
            {/* Scrims: readable copy on any photo, a top band for the transparent
                navbar's white links, plus a cream fade into the page body */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/15" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-cream)] to-transparent" />

            <motion.div
              variants={heroStagger}
              initial="hidden"
              animate="show"
              style={{ opacity: copyOpacity }}
              className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center"
            >
              {/* Breadcrumb */}
              <motion.nav
                variants={heroItem}
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-sm text-white/80 mb-4"
              >
                <Link href="/" className="hover:text-white transition-colors duration-300">
                  Home
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white">{category.name}</span>
              </motion.nav>

              {/* The category name is the focal point — same italic-first voice as
                  the homepage hero, at display scale. Everything else supports it. */}
              <motion.h1
                variants={heroItem}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight [text-wrap:balance]"
                style={serif}
              >
                <span className="italic">{possessive(category.name)}</span>
                <br />
                Collection
              </motion.h1>

              {/* Gold keyline — the site's underline motif, drawn on entrance */}
              <motion.div
                variants={heroItem}
                className="mt-6 flex items-center gap-4"
              >
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="block h-0.5 w-16 origin-left bg-[var(--color-secondary)] motion-reduce:transition-none"
                />
                <span className="text-sm font-semibold tracking-wide text-[var(--color-secondary)]">
                  {products.length} {products.length === 1 ? 'piece' : 'pieces'}
                </span>
              </motion.div>

              {category.description && (
                <motion.p
                  variants={heroItem}
                  className="mt-5 max-w-lg text-base md:text-lg text-white/85 leading-relaxed [text-wrap:pretty]"
                >
                  {category.description}
                </motion.p>
              )}
            </motion.div>
          </section>

          {/* ---- Filters + Grid ---- */}
          <div className="w-full px-4 sm:px-6 lg:px-8 mt-2">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                className="lg:w-72 flex-shrink-0"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-28">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <SlidersHorizontal className="w-4 h-4 text-[var(--color-secondary)]" />
                      Filters
                    </h2>
                    <AnimatePresence>
                      {hasActiveFilters && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleClearFilters}
                          className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors font-medium"
                        >
                          Clear All
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-[var(--color-terracotta)]">
                      Price Range
                    </h3>
                    <div className="pt-2 pb-4">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        step={100}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      {/* Keyed spans re-mount on change for a soft tick animation */}
                      <motion.span
                        key={`lo-${priceRange[0]}`}
                        initial={{ opacity: 0.4, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ₹{priceRange[0].toLocaleString()}
                      </motion.span>
                      <motion.span
                        key={`hi-${priceRange[1]}`}
                        initial={{ opacity: 0.4, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ₹{priceRange[1].toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </motion.aside>

              {/* Products Grid */}
              <div className="flex-1">
                {/* Result count ticker */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-gray-500 mb-4"
                >
                  Showing{' '}
                  <motion.span
                    key={filteredProducts.length}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="inline-block font-semibold text-[var(--color-primary-dark)]"
                  >
                    {filteredProducts.length}
                  </motion.span>{' '}
                  of {products.length} pieces
                </motion.p>

                {filteredProducts.length > 0 ? (
                  <motion.div
                    layout
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8"
                  >
                    {/* popLayout: removed cards fade out while survivors glide into place */}
                    <AnimatePresence mode="popLayout">
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2" style={serif}>
                      Nothing here yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Try widening your price range to see more of the collection.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleClearFilters}
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium transition-colors"
                    >
                      Clear all filters
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  )
}
