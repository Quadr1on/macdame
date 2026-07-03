import { getProductBySlug } from '@/lib/products'
import ProductDetail from './ProductDetail'

export default async function ProductPage({ params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  return <ProductDetail product={product} />
}
