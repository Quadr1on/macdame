'use client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HeroSlideshow from '@/components/home/HeroSlideshow'
import SmoothScroll from '@/components/home/SmoothScroll'
import ProductBrowser from '@/components/shop/ProductBrowser'

/**
 * All clothing: the full-screen slideshow with one slide per collection, the
 * page title set large in the corner, then every piece in the shop.
 */
export default function ShopContent({ products, slides }) {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <SmoothScroll />
      <Navbar />
      <main>
        <HeroSlideshow
          slides={slides}
          title="All clothing"
          subtitle={`${products.length} pieces, sent from Kerala`}
          label="MacDame collections"
          compact
        />
        <ProductBrowser
          products={products}
          heading="Every piece in the shop"
          intro="Kasavu sarees, mundus, veshtis and festival wear for women, men and children."
        />
      </main>
      <Footer />
    </div>
  )
}
