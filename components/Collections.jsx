'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const collections = [
  {
    id: 1,
    name: 'Kasavu Sarees',
    description: 'Timeless Kerala sarees with golden kasavu borders for festivals',
    image: '/collection-sarees.png',
    href: '/collections/sarees',
    itemCount: 75,
    gridClass: 'md:col-span-2 md:row-span-2', // Large featured tile
  },
  {
    id: 2,
    name: "Men's Traditional",
    description: 'Classic vesti & mundus for the modern gentleman',
    image: '/collection-mens.png',
    href: '/collections/mens',
    itemCount: 45,
    gridClass: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 3,
    name: 'Bridal Collection',
    description: 'Luxurious silk sarees for your special day',
    image: '/product-bridal-saree.png',
    href: '/collections/bridal',
    itemCount: 30,
    gridClass: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 4,
    name: 'Festive Wear',
    description: 'Celebrate in style with vibrant ethnic pieces',
    image: '/collection-festive.png',
    href: '/collections/festive',
    itemCount: 50,
    gridClass: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 5,
    name: 'New Arrivals',
    description: 'Fresh designs just in',
    image: '/collection-new.png',
    href: '/collections/new',
    itemCount: 25,
    gridClass: 'md:col-span-2 md:row-span-1', // Wide tile
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

export default function Collections() {
  return (
    <section className="py-20 bg-gradient-to-b from-[var(--color-cream)] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[var(--color-secondary)] tracking-wider uppercase">
            Shop by Category
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">
            Our Collections
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our carefully curated collections of authentic South Indian traditional wear
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[200px] md:auto-rows-[220px]"
        >
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              variants={itemVariants}
              className={`${collection.gridClass} group`}
            >
              <Link
                href={collection.href}
                className="relative block w-full h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                {/* Background Image */}
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                {/* Content */}
                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                  {/* Item Count Badge */}
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="inline-block w-fit px-3 py-1 bg-[var(--color-secondary)] text-white text-xs font-semibold rounded-full mb-2 md:mb-3"
                  >
                    {collection.itemCount}+ Items
                  </motion.span>

                  {/* Title */}
                  <h3
                    className={`font-bold text-white leading-tight mb-1 md:mb-2 ${
                      index === 0 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
                    }`}
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {collection.name}
                  </h3>

                  {/* Description - only on larger tiles */}
                  {(index === 0 || collection.gridClass.includes('col-span-2')) && (
                    <p className="text-white/80 text-sm md:text-base mb-3 line-clamp-2">
                      {collection.description}
                    </p>
                  )}

                  {/* Explore Link */}
                  <div className="flex items-center gap-2 text-white font-medium text-sm group-hover:gap-3 transition-all duration-300">
                    <span>Explore Collection</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-[var(--color-secondary)]/0 group-hover:bg-[var(--color-secondary)]/10 transition-colors duration-300 pointer-events-none" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
