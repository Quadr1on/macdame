import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/admin-auth'
import { can } from '@/lib/admin-permissions'
import { PageHeader, NoAccess } from '@/components/admin/ui'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }) {
  const { access } = await getAdminUser()
  if (!can(access, 'products.edit')) return <NoAccess what="editing products" />

  const { id } = await params
  const admin = createAdminClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    admin.from('products').select('*, product_variants(*)').eq('id', id).maybeSingle(),
    admin.from('categories').select('id, name').order('name'),
  ])

  if (!product) notFound()

  return (
    <>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        All products
      </Link>

      <PageHeader title={product.name} description={`/products/${product.slug}`}>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          View in shop
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </PageHeader>

      <ProductForm categories={categories ?? []} product={product} canDelete={can(access, 'products.delete')} />
    </>
  )
}
