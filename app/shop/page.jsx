import { getAllProducts } from '@/lib/products'
import ShopContent from './ShopContent'

export default async function ShopPage() {
  const products = await getAllProducts()

  return <ShopContent products={products} />
}
