'use client'
import { useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  Star, ShoppingBag, Heart, Share2, ChevronDown, ChevronUp,
  Truck, RotateCcw, ShieldCheck, Eye, Check, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react'
import useCartStore from '@/lib/cart-store'
import allProducts from '@/lib/products-data'

export default function ProductPage({ params }) {
  const { id } = use(params)
  const product = allProducts.find((p) => p.id === parseInt(id))
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [pincode, setPincode] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState(null) // null | 'available' | 'unavailable'
  const [showDetails, setShowDetails] = useState(true)
  const [showHighlights, setShowHighlights] = useState(true)

  const addItem = useCartStore((state) => state.addItem)

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)]">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Product not found
            </h1>
            <p className="text-gray-500">The product you're looking for doesn't exist.</p>
            <Link href="/shop">
              <Button className="text-[var(--color-cream)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]">
                Back to Shop
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const images = product.images || [product.image]
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  const handleAddToCart = () => {
    addItem(product)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    addItem(product)
    router.push('/cart')
  }

  const handlePincodeCheck = () => {
    if (pincode.length === 6) {
      // Simulate pincode check
      setPincodeStatus(parseInt(pincode[0]) <= 5 ? 'available' : 'unavailable')
    }
  }

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % images.length)
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-gray-500 mb-6"
          >
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[var(--color-primary)] transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </motion.nav>

          {/* Main Product Layout */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

            {/* ======== LEFT: Image Gallery ======== */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-[55%] flex-shrink-0"
            >
              <div className="flex flex-col-reverse md:flex-row gap-4">
                {/* Thumbnail Strip */}
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-2 md:pb-0 md:pr-2 scrollbar-thin">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index
                          ? 'border-[var(--color-secondary)] shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image src={img} alt={`${product.name} view ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>

                {/* Main Image */}
                <div className="relative flex-1 aspect-[3/4] rounded-xl overflow-hidden bg-[#f8f6f3] group">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={images[selectedImage]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Prev / Next Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === selectedImage
                            ? 'w-6 h-2 bg-[var(--color-secondary)]'
                            : 'w-2 h-2 bg-white/60'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.isNew && (
                      <span className="px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest rounded-sm uppercase">
                        New
                      </span>
                    )}
                    {product.isBestseller && (
                      <span className="px-3 py-1.5 bg-[var(--color-secondary)]/90 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest rounded-sm uppercase">
                        Bestseller
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="px-3 py-1.5 bg-[var(--color-terracotta)] text-white text-[10px] font-semibold tracking-widest rounded-sm uppercase">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Share / Wishlist floating */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        isWishlisted
                          ? 'bg-[var(--color-terracotta)] text-white'
                          : 'bg-white/90 text-gray-600 hover:text-[var(--color-terracotta)]'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-[var(--color-primary)] transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ======== RIGHT: Product Info ======== */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 space-y-6"
            >
              {/* Name & Rating */}
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-sm font-semibold rounded-md">
                    {product.rating}
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.reviews.toLocaleString()} Ratings
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        MRP ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="text-lg font-semibold text-green-600">
                        (₹{(product.originalPrice - product.price).toLocaleString()} OFF)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-[var(--color-secondary-dark)]">inclusive of all taxes</p>
              </div>

              {/* SKU */}
              <p className="text-xs text-gray-400">SKU ID — {product.sku}</p>

              {/* Color */}
              {product.color && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Colour</h3>
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 border-2 border-[var(--color-secondary)] rounded-lg text-sm font-medium text-gray-800 bg-[var(--color-cream)]">
                      {product.color}
                    </div>
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Size</h3>
                    <button className="text-sm text-[var(--color-primary)] hover:underline font-medium flex items-center gap-1">
                      Size Chart
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-5 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                          selectedSize === size
                            ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 text-[var(--color-primary)]'
                            : 'border-gray-200 text-gray-700 hover:border-[var(--color-secondary)]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Views */}
              {product.recentViews && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4 text-[var(--color-secondary)]" />
                  <span>
                    <strong className="text-gray-700">{product.recentViews.toLocaleString()}</strong> people have viewed this product recently
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className={`flex-1 py-6 text-base font-semibold rounded-xl border-2 gap-2 transition-all duration-300 ${
                    addedToCart
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                  }`}
                >
                  {addedToCart ? (
                    <><Check className="w-5 h-5" /> Added to Cart</>
                  ) : (
                    <><ShoppingBag className="w-5 h-5" /> Add to Cart</>
                  )}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 py-6 text-base font-semibold text-white bg-[var(--color-terracotta)] hover:bg-[var(--color-terracotta)]/90 rounded-xl shadow-lg gap-2 transition-all duration-300"
                >
                  Buy Now
                </Button>
              </div>

              {/* Pincode Checker */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900">Delivery Options</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/\D/g, ''))
                      setPincodeStatus(null)
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--color-secondary)] transition-colors"
                  />
                  <button
                    onClick={handlePincodeCheck}
                    disabled={pincode.length !== 6}
                    className="px-5 py-2.5 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white border-2 border-[var(--color-primary)] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    CHECK
                  </button>
                </div>
                {pincodeStatus === 'available' && (
                  <p className="text-sm text-green-600 font-medium">✓ Delivery available — estimated 2-4 days</p>
                )}
                {pincodeStatus === 'unavailable' && (
                  <p className="text-sm text-red-500 font-medium">✗ Sorry, delivery not available to this pincode</p>
                )}

                {/* Service Badges */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Truck className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                    <span>Free delivery above ₹999</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <RotateCcw className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                    <span>Easy exchange in 10 days</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                    <span>Quality assured</span>
                  </div>
                </div>
              </div>

              {/* Product Details (Collapsible) */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Product Details</h3>
                  {showDetails ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-5">
                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                          {[
                            ['Colour', product.color],
                            ['Material', product.material],
                            ['Work', product.work],
                            ['Items Included', product.itemsIncluded],
                            ['Wash Care', product.washCare],
                          ].map(([label, value]) => value && (
                            <div key={label}>
                              <dt className="text-xs font-bold text-gray-700 uppercase">{label}</dt>
                              <dd className="text-sm text-gray-600 mt-0.5">{value}</dd>
                            </div>
                          ))}
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-700 uppercase mb-1.5">Description</h4>
                          <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Georgia, serif', fontStyle: 'normal' }}>
                            {product.description}
                          </p>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-xs text-gray-400 italic">
                          Product color may slightly vary due to photographic lighting sources or your monitor/screen settings.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Highlights (Collapsible) */}
              {product.highlights && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowHighlights(!showHighlights)}
                    className="w-full flex items-center justify-between px-5 py-4"
                  >
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Highlights</h3>
                    {showHighlights ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {showHighlights && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <ul className="px-5 pb-5 space-y-2">
                          {product.highlights.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Ratings Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Ratings & Reviews</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{product.rating}</div>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'fill-[var(--color-secondary)] text-[var(--color-secondary)]'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{product.reviews} reviews</p>
                  </div>

                  {/* Rating Bars */}
                  <div className="flex-1 space-y-1.5">
                    {[
                      { stars: 5, pct: 68 },
                      { stars: 4, pct: 20 },
                      { stars: 3, pct: 8 },
                      { stars: 2, pct: 3 },
                      { stars: 1, pct: 1 },
                    ].map((bar) => (
                      <div key={bar.stars} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-gray-500">{bar.stars}</span>
                        <Star className="w-3 h-3 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-secondary)] rounded-full"
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-400">{bar.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
