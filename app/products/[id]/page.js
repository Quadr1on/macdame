import { getProductById } from '@/lib/products'
import ProductPageClient from './ProductPageClient'

export default async function ProductPage({ params }) {
  const { id } = await params
  const product = await getProductById(parseInt(id))

  return <ProductPageClient product={product} />
}
