'use client'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingBag, Star } from 'lucide-react'

export default function ProductCard({ product }) {
  const {
    name = 'Kerala Kasavu Saree',
    price = 2499,
    originalPrice = 3499,
    image = '/product-kasavu-saree.png',
    rating = 4.8,
    reviews = 124,
    isNew = false,
    isBestseller = false,
  } = product || {}

  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="px-3 py-1 bg-[var(--color-terracotta)] text-white text-xs font-bold rounded-full">
              NEW
            </span>
          )}
          {isBestseller && (
            <span className="px-3 py-1 bg-[var(--color-secondary)] text-white text-xs font-bold rounded-full">
              BESTSELLER
            </span>
          )}
          {discount > 0 && (
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[var(--color-terracotta)] hover:text-white">
          <Heart className="w-5 h-5" />
        </button>

        {/* Quick Add Button */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Button className="w-full bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white font-semibold shadow-lg">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
          <span className="text-sm font-medium text-gray-700">{rating}</span>
          <span className="text-sm text-gray-400">({reviews})</span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[var(--color-primary)]">
            ₹{price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
