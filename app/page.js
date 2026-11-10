import Navbar from '@/components/Navbar'
import HomeHero from '@/components/home/HomeHero'
import Collections from '@/components/Collections'
import FeaturedProducts from '@/components/FeaturedProducts'
import OrderChapters from '@/components/home/OrderChapters'
import KasavuFeature from '@/components/home/KasavuFeature'
import Footer from '@/components/Footer'
import { getFeaturedProducts, getAllCategories, getCategoryPriceFloors } from '@/lib/products'

/*
 * Home page plan (tasteskill 2.5 redesign route, built by hand: the skill's
 * scripts were not run in this environment).
 *
 * Kind: product (a clothing brand selling online; site-kind other). Photographs
 * lead; no effects, grounds or loops.
 * Deal: hero product · nav nav-cards (kept: the shared site navbar) · footer
 * footer-dark · close close-type · rhythm dark-band · buttons arrow · moment
 * pinned-chapters. Palette and type kept from the brand (cream, brown ink,
 * gold; Marcellus + Figtree).
 *
 * 1. hero          one full-screen photograph, one button (h1 for readers)       1 screen
 * 2. collections   the range: every collection as a photograph tile              1 screen
 * 3. bestsellers   four featured products                                        1 screen
 * 4. ordering      dark band, pinned-chapters: three steps beside one frame      2 screens live
 * 5. kasavu        tall-small: the woven border, in two photographs              1 screen
 * 6. footer        close-type (main action) + links, one screen                  1 screen
 */

// Catalog data is public — cache the rendered page and refresh every 5 min
export const revalidate = 300

const inr = (n) => `₹${n.toLocaleString('en-IN')}`

export default async function Home() {
  const [featuredProducts, collections, floors] = await Promise.all([
    getFeaturedProducts(4),
    getAllCategories(),
    getCategoryPriceFloors(),
  ])

  const totalCount = collections.reduce((sum, c) => sum + c.itemCount, 0)
  const lowest = Object.values(floors).length ? Math.min(...Object.values(floors)) : null

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main>
        <HomeHero />
        <Collections collections={collections} />
        <FeaturedProducts products={featuredProducts} totalCount={totalCount} />
        <OrderChapters />
        <KasavuFeature />
      </main>
      <Footer
        closing={{
          title: 'Festival wear for the whole family',
          line: lowest
            ? `Sarees, mundus and children's sets from ${inr(lowest)}, sent from Kerala.`
            : 'Sarees, mundus and children’s sets, sent from Kerala.',
        }}
      />
    </div>
  )
}
