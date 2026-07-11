import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import FeaturedProducts from '@/components/FeaturedProducts'
import Collections from '@/components/Collections'
import Footer from '@/components/Footer'
import { getFeaturedProducts } from '@/lib/products'

// Catalog data is public — cache the rendered page and refresh every 5 min
export const revalidate = 300

export default async function Home() {
  const featuredProducts = await getFeaturedProducts(4)

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main>
        <Hero />
        <FeaturedProducts products={featuredProducts} />
        <Collections />
      </main>
      <Footer />
    </div>
  )
}