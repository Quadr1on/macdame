'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'

import allProducts from '@/lib/products-data'

const MIN_PRICE = 0
const MAX_PRICE = 20000

export default function ShopPage() {
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE])

  // Filter products based on price range
  const filteredProducts = useMemo(() => {
    return allProducts.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    )
  }, [priceRange])

  const handleClearFilters = () => {
    setPriceRange([MIN_PRICE, MAX_PRICE])
  }

  const hasActiveFilters = priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-[var(--color-primary-dark)] mb-8"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Sarees
          </motion.h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:w-72 flex-shrink-0"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-28">
                {/* Filters Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Price Range Filter */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[var(--color-terracotta)]">
                    Price Range
                  </h3>
                  
                  {/* Custom Range Slider */}
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

                  {/* Price Labels */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Products Grid */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {filteredProducts.length > 0 ? (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-8"
                  >
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Try changing your filter criteria
                    </p>
                    <button
                      onClick={handleClearFilters}
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium transition-colors"
                    >
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
