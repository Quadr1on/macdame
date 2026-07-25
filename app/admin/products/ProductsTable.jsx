'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/admin/ui'
import { formatCurrency } from '@/lib/order-status'

function ActiveToggle({ productId, active, onError }) {
  const router = useRouter()
  const [checked, setChecked] = useState(active)
  const [pending, setPending] = useState(false)

  async function toggle() {
    const next = !checked
    setChecked(next) // optimistic — reverted below if the write fails
    setPending(true)

    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    })
    setPending(false)

    if (!res.ok) {
      setChecked(!next)
      const payload = await res.json().catch(() => ({}))
      onError(payload.error ?? 'Could not update this product')
      return
    }
    router.refresh()
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Deactivate product' : 'Activate product'}
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[1.15rem]' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ProductsTable({ products }) {
  const [error, setError] = useState('')

  if (products.length === 0) {
    return <EmptyState>No products yet. Add your first one to get the shop going.</EmptyState>
  }

  return (
    <>
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead className="px-4 text-slate-500">Product</TableHead>
            <TableHead className="text-slate-500">Collection</TableHead>
            <TableHead className="text-slate-500 text-right">Price</TableHead>
            <TableHead className="text-slate-500 text-right">Variants</TableHead>
            <TableHead className="text-slate-500 text-right">Stock</TableHead>
            <TableHead className="px-4 text-slate-500 text-right">Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const variants = product.product_variants ?? []
            const stock = variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)

            return (
              <TableRow key={product.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4">
                  <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3 group">
                    <span className="relative flex h-11 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                      {product.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-slate-300" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900 group-hover:underline">
                        {product.name}
                      </span>
                      <span className="block text-xs text-slate-400">/{product.slug}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-slate-600">{product.categories?.name ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-900">
                  {formatCurrency(product.base_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-slate-600">
                  {variants.length}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${stock === 0 ? 'text-red-600 font-medium' : 'text-slate-600'}`}
                >
                  {stock}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <ActiveToggle
                    productId={product.id}
                    active={product.is_active}
                    onError={setError}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
