import { getProductBySlug } from '@/lib/products'
import ProductDetail from './ProductDetail'

// Catalog data is public — cache the rendered page and refresh every 5 min
export const revalidate = 300

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  return <ProductDetail product={product} />
}
