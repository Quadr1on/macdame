import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import FeaturedProducts from '@/components/FeaturedProducts'
import Collections from '@/components/Collections'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main>
        <Hero />
        <FeaturedProducts />
        <Collections />
      </main>
      <Footer />
    </div>
  )
}