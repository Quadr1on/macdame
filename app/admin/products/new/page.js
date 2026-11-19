import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin-auth'
import { can } from '@/lib/admin-permissions'
import { PageHeader, NoAccess } from '@/components/admin/ui'
import ProductForm from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const { access } = await getAdminUser()
  if (!can(access, 'products.edit')) return <NoAccess what="adding products" />

  const admin = createAdminClient()
  const { data: categories } = await admin
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        All products
      </Link>

      <PageHeader title="Add product" description="It goes live in the shop as soon as you save." />

      {categories?.length ? (
        <ProductForm categories={categories} />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Create a collection first — every product has to belong to one.{' '}
          <Link href="/admin/collections" className="font-medium underline">
            Go to Collections
          </Link>
        </p>
      )}
    </>
  )
}
