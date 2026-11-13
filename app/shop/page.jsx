import { getAllProducts, getAllCategories } from '@/lib/products'
import { buildShopSlides } from '@/lib/hero-slides'
import ShopContent from './ShopContent'

export const metadata = {
  title: 'All clothing - Macdame',
  description: 'Every piece in the shop: kasavu sarees, mundus, veshtis and festival wear for women, men and children.',
}

// Catalog data is public — cache the rendered page and refresh every 5 min
export const revalidate = 300

export default async function ShopPage() {
  const [products, collections] = await Promise.all([getAllProducts(), getAllCategories()])

  return <ShopContent products={products} slides={buildShopSlides(collections)} />
}
