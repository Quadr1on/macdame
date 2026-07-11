'use client'
import Link from 'next/link'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function FeaturedProducts({ products = [] }) {
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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/shop">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white px-8 font-semibold transition-all hover:scale-105"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
