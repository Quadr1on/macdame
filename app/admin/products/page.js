import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel, EmptyState } from '@/components/admin/ui'
import ProductsTable from './ProductsTable'

export default async function AdminProductsPage() {
  const admin = createAdminClient()

  const { data: products, error } = await admin
    .from('products')
    .select('id, name, slug, image, base_price, is_active, categories(name), product_variants(id, stock_quantity)')
    .order('created_at', { ascending: false })

  const activeCount = (products ?? []).filter((product) => product.is_active).length

  return (
    <>
      <PageHeader
        title="Products"
        description={
          error
            ? 'Could not load products'
            : `${products.length} product${products.length === 1 ? '' : 's'} · ${activeCount} active`
        }
      >
        <Link href="/admin/products/new">
          <Button className="gap-1.5 bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        </Link>
      </PageHeader>

      <Panel>
        {error ? (
          <EmptyState>Failed to load products: {error.message}</EmptyState>
        ) : (
          <ProductsTable products={products} />
        )}
      </Panel>
    </>
  )
}
