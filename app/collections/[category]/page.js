import { notFound } from 'next/navigation'
import { getCategoryWithProducts } from '@/lib/products'
import CollectionContent from './CollectionContent'

// Catalog data is public — cache the rendered page and refresh every 5 min
export const revalidate = 300

// "Men" -> "Men's", but "Kids" -> "Kids'" (names already ending in s)
function possessive(name) {
  return name.endsWith('s') ? `${name}'` : `${name}'s`
}

export async function generateMetadata({ params }) {
  const { category: slug } = await params
  const data = await getCategoryWithProducts(slug)
  if (!data) return { title: 'Collection Not Found - Macdame' }

  return {
    title: `${possessive(data.category.name)} Collection - Macdame`,
    description: data.category.description,
  }
}

export default async function CollectionPage({ params }) {
  const { category: slug } = await params
  const data = await getCategoryWithProducts(slug)

  if (!data) notFound()

  return <CollectionContent category={data.category} products={data.products} />
}
