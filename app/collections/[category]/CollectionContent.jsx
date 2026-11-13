'use client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HeroSlideshow from '@/components/home/HeroSlideshow'
import SmoothScroll from '@/components/home/SmoothScroll'
import ProductBrowser from '@/components/shop/ProductBrowser'

const pieces = (n) => `${n} ${n === 1 ? 'piece' : 'pieces'}`

/**
 * A collection page (women, men, kids, uniforms): the home page's slideshow in
 * its compact form (a bit over half the screen, fading into the cream page),
 * built from this collection's own photographs —
 * its cover first, then each distinct product photo captioned with the piece
 * and its price — with the collection's name set large in the bottom-left
 * corner. Below it, the pieces.
 */
export default function CollectionContent({ category, products, slides }) {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <SmoothScroll />
      <Navbar />
      <main>
        <HeroSlideshow
          slides={slides}
          title={category.name}
          subtitle={products.length ? pieces(products.length) : 'Coming soon'}
          label={`${category.name} collection`}
          compact
        />
        <ProductBrowser
          products={products}
          activeSlug={category.slug}
          heading={`${category.name}’s pieces`.replace('s’s', 's’')}
          intro={category.description}
        />
      </main>
      <Footer />
    </div>
  )
}
