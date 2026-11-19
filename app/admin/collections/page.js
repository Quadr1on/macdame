import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin-auth'
import { can } from '@/lib/admin-permissions'
import { PageHeader, NoAccess } from '@/components/admin/ui'
import CategoriesManager from './CategoriesManager'

export default async function AdminCollectionsPage() {
  const { access } = await getAdminUser()
  if (!can(access, 'collections.manage')) return <NoAccess what="collections" />

  const admin = createAdminClient()

  // products(count) rides the FK to return the product tally per category in a
  // single round trip instead of one query per collection.
  const { data: categories, error } = await admin
    .from('categories')
    .select('id, name, slug, description, image_url, products(count)')
    .order('name')

  const rows = (categories ?? []).map((category) => ({
    ...category,
    productCount: category.products?.[0]?.count ?? 0,
  }))

  return (
    <>
      <PageHeader
        title="Collections"
        description="These drive the homepage tiles, the navbar menu and every /collections URL."
      />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load collections: {error.message}
        </p>
      ) : (
        <CategoriesManager categories={rows} />
      )}
    </>
  )
}
