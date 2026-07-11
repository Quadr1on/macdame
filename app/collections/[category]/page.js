import { notFound } from 'next/navigation'
import { getCategoryWithProducts } from '@/lib/products'
import CollectionContent from './CollectionContent'

export async function generateMetadata({ params }) {
  const { category: slug } = await params
  const data = await getCategoryWithProducts(slug)
  if (!data) return { title: 'Collection Not Found - Macdame' }

  return {
    title: `${data.category.name}'s Collection - Macdame`,
    description: data.category.description,
  }
}

export default async function CollectionPage({ params }) {
  const { category: slug } = await params
  const data = await getCategoryWithProducts(slug)

  if (!data) notFound()

  return <CollectionContent category={data.category} products={data.products} />
}
