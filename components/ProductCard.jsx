'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Star, Eye, Check } from 'lucide-react'
import useCartStore from '@/lib/cart-store'

export default function ProductCard({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const {
    name = 'Kerala Kasavu Saree',
    price = 2499,
    originalPrice = 3499,
    image = '/product-kasavu-saree.png',
    rating = 4.8,
    reviews = 124,
    isNew = false,
    isBestseller = false,
    href = '/products/1',
  } = product || {}

  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-xl overflow-hidden"
    >
      {/* Subtle Border Glow on Hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--color-secondary)]/0 via-[var(--color-secondary)]/0 to-[var(--color-primary)]/0 group-hover:from-[var(--color-secondary)]/20 group-hover:to-[var(--color-primary)]/10 transition-all duration-500 pointer-events-none" />
      
      {/* Card Shadow */}
      <div className="absolute inset-0 rounded-xl shadow-sm group-hover:shadow-xl transition-shadow duration-500" />

      <div className="relative">
        {/* Image Container */}
        <Link href={href} className="block relative aspect-[3/4] overflow-hidden bg-[#f8f6f3]">
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full h-full"
          >
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
          </motion.div>
          
          {/* Elegant Gradient Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"
          />
        </Link>

        {/* Refined Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <AnimatePresence>
            {isNew && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest rounded-sm uppercase"
              >
                New
              </motion.span>
            )}
            {isBestseller && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.1 }}
                className="px-3 py-1.5 bg-[var(--color-secondary)]/90 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest rounded-sm uppercase"
              >
                Bestseller
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Discount Badge - Minimal */}
        {discount > 0 && (
          <div className="absolute top-4 right-4">
            <span className="text-xs font-medium text-[var(--color-terracotta)]">
              -{discount}%
            </span>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <AnimatePresence>
            {isHovered && (
              <>
                {/* Wishlist Button */}
                <motion.button
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: 0 }}
                  onClick={(e) => {
                    e.preventDefault()
                    setIsWishlisted(!isWishlisted)
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isWishlisted
                      ? 'bg-[var(--color-terracotta)] text-white'
                      : 'bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-[var(--color-terracotta)] hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </motion.button>

                {/* Quick View Button */}
                <motion.button
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-300"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Add to Cart - Elegant Bottom Bar */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 p-4"
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  addItem(product)
                  setAddedToCart(true)
                  setTimeout(() => setAddedToCart(false), 1500)
                }}
                className={`w-full py-3 backdrop-blur-sm text-sm font-medium tracking-wide rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-white/95 text-gray-900 hover:bg-[var(--color-primary)] hover:text-white'
                }`}
              >
                {addedToCart ? (
                  <><Check className="w-4 h-4" /> Added!</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Add to Cart</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative p-5 space-y-3">
        {/* Rating - Subtle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating)
                    ? 'fill-[var(--color-secondary)] text-[var(--color-secondary)]'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">({reviews})</span>
        </div>

        {/* Name */}
        <Link href={href}>
          <h3 
            className="font-medium text-gray-800 group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-2 leading-snug"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-semibold text-gray-900">
            ₹{price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
