'use client'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const featuredProducts = [
  {
    id: 1,
    name: 'Classic Kerala Kasavu Saree',
    price: 2499,
    originalPrice: 3499,
    image: '/product-kasavu-saree.png',
    rating: 4.9,
    reviews: 156,
    isBestseller: true,
  },
  {
    id: 2,
    name: 'Premium Set Mundu with Kasavu Border',
    price: 1899,
    originalPrice: 2499,
    image: '/product-set-mundu.png',
    rating: 4.8,
    reviews: 98,
    isNew: true,
  },
  {
    id: 3,
    name: 'Bridal Silk Saree with Zari Work',
    price: 8999,
    originalPrice: 12999,
    image: '/product-bridal-saree.png',
    rating: 5.0,
    reviews: 67,
    isBestseller: true,
  },
  {
    id: 4,
    name: 'Traditional Vesti Double Mundu',
    price: 1499,
    originalPrice: 1999,
    image: '/product-set-mundu.png',
    rating: 4.7,
    reviews: 203,
  },
]

export default function FeaturedProducts() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-[var(--color-secondary)] tracking-wider uppercase">
            Curated Selection
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">
            Featured Products
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Handpicked traditional wear that embodies the rich heritage of Kerala craftsmanship
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white px-8 font-semibold transition-all hover:scale-105"
          >
            View All Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
