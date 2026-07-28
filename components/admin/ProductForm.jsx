'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Panel, adminPrimaryButton, adminDangerIconButton } from '@/components/admin/ui'
import ImageUploader from '@/components/admin/ImageUploader'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { slugify } from '@/lib/utils'

const emptyVariant = { id: null, color: '', size: '', sku: '', price: '', stock_quantity: '0' }

function blankForm() {
  return {
    name: '',
    slug: '',
    category_id: '',
    description: '',
    base_price: '',
    original_price: '',
    images: [],
    material: '',
    work: '',
    wash_care: '',
    items_included: '',
    highlights: [],
    is_new: false,
    is_bestseller: false,
    is_active: true,
  }
}

function formFromProduct(product) {
  return {
    name: product.name ?? '',
    slug: product.slug ?? '',
    category_id: product.category_id ?? '',
    description: product.description ?? '',
    base_price: product.base_price ?? '',
    original_price: product.original_price ?? '',
    images: product.images ?? [],
    material: product.material ?? '',
    work: product.work ?? '',
    wash_care: product.wash_care ?? '',
    items_included: product.items_included ?? '',
    highlights: product.highlights ?? [],
    is_new: product.is_new ?? false,
    is_bestseller: product.is_bestseller ?? false,
    is_active: product.is_active ?? true,
  }
}

function Checkbox({ id, checked, onChange, label, hint }) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-sm text-slate-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 rounded border-slate-300"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  )
}

export default function ProductForm({ categories, product = null }) {
  const router = useRouter()
  const isEdit = Boolean(product)

  const [form, setForm] = useState(() => (product ? formFromProduct(product) : blankForm()))
  const [variants, setVariants] = useState(() =>
    product?.product_variants?.length
      ? product.product_variants.map((variant) => ({
          id: variant.id,
          color: variant.color ?? '',
          size: variant.size ?? '',
          sku: variant.sku ?? '',
          price: variant.price ?? '',
          stock_quantity: String(variant.stock_quantity ?? 0),
        }))
      : [{ ...emptyVariant }]
  )
  // Track whether the admin has hand-edited the slug; until they do, it keeps
  // following the name so they never have to think about it.
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  function setVariant(index, key, value) {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [key]: value } : variant)))
  }

  const filledVariants = variants.filter((variant) => variant.sku.trim() !== '')
  const duplicateSku = (() => {
    const seen = new Set()
    for (const variant of filledVariants) {
      const key = variant.sku.trim().toLowerCase()
      if (seen.has(key)) return variant.sku
      seen.add(key)
    }
    return null
  })()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (duplicateSku) {
      setError(`Two variants share the SKU "${duplicateSku}". SKUs must be unique.`)
      return
    }

    setSaving(true)
    const res = await fetch(isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, variants: filledVariants }),
    })
    const payload = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(payload.error ?? 'Failed to save the product')
      return
    }

    router.push('/admin/products')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return

    setDeleting(true)
    setError('')
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    const payload = await res.json().catch(() => ({}))
    setDeleting(false)

    if (!res.ok) {
      setError(payload.error ?? 'Failed to delete the product')
      return
    }

    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3 items-start">
      <div className="lg:col-span-2 space-y-4">
        <Panel title="Basics">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: slugTouched ? prev.slug : slugify(name),
                  }))
                }}
                placeholder="Kasavu Saree with Gold Border"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    set('slug', event.target.value)
                  }}
                  placeholder="kasavu-saree-gold-border"
                />
                <p className="text-xs text-slate-500">/products/{form.slug || '…'}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Collection</Label>
                <Select value={form.category_id} onValueChange={(value) => set('category_id', value)}>
                  <SelectTrigger id="category_id" className="w-full">
                    <SelectValue placeholder="Pick a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="base_price">Price (₹)</Label>
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.base_price}
                  onChange={(event) => set('base_price', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="original_price">Compare-at price (₹)</Label>
                <Input
                  id="original_price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.original_price ?? ''}
                  onChange={(event) => set('original_price', event.target.value)}
                  placeholder="Optional — shown struck through"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Photos">
          <div className="p-4">
            <ImageUploader
              value={form.images}
              onChange={(images) => set('images', images)}
              label="Product images"
            />
          </div>
        </Panel>

        <Panel
          title="Variants"
          description="Colour, size, stock and SKU. Checkout prices each cart line by SKU."
        >
          <div className="p-4 space-y-3">
            {filledVariants.length === 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Saving with no variants is allowed — checkout falls back to the base price — but
                  you lose per-size stock tracking and SKU matching on orders.
                </p>
              </div>
            )}

            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-11 sm:items-end">
                <div className="space-y-1 sm:col-span-2">
                  {index === 0 && <Label className="text-xs">Colour</Label>}
                  <Input
                    value={variant.color}
                    onChange={(event) => setVariant(index, 'color', event.target.value)}
                    placeholder="Off-white"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  {index === 0 && <Label className="text-xs">Size</Label>}
                  <Input
                    value={variant.size}
                    onChange={(event) => setVariant(index, 'size', event.target.value)}
                    placeholder="Free size"
                  />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  {index === 0 && <Label className="text-xs">SKU</Label>}
                  <Input
                    value={variant.sku}
                    onChange={(event) => setVariant(index, 'sku', event.target.value)}
                    placeholder="MCD-SAR-001-FS"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  {index === 0 && <Label className="text-xs">Price (₹)</Label>}
                  <Input
                    type="number"
                    min="0"
                    value={variant.price}
                    onChange={(event) => setVariant(index, 'price', event.target.value)}
                    placeholder={form.base_price || '0'}
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && <Label className="text-xs">Stock</Label>}
                  <Input
                    type="number"
                    min="0"
                    value={variant.stock_quantity}
                    onChange={(event) => setVariant(index, 'stock_quantity', event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                  disabled={variants.length === 1}
                  className={`h-9 justify-self-start ${adminDangerIconButton}`}
                  aria-label="Remove variant"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {duplicateSku && (
              <p className="text-xs text-red-600">
                Two variants share the SKU &ldquo;{duplicateSku}&rdquo;.
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVariants((prev) => [...prev, { ...emptyVariant }])}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add variant
            </Button>
          </div>
        </Panel>

        <Panel title="Details" description="Shown on the product page">
          <div className="p-4 grid gap-4 sm:grid-cols-2">
            {[
              ['material', 'Material', 'Handloom cotton'],
              ['work', 'Work', 'Kasavu zari border'],
              ['wash_care', 'Wash care', 'Dry clean only'],
              ['items_included', 'Items included', '1 saree, 1 blouse piece'],
            ].map(([key, label, placeholder]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(event) => set(key, event.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}

            <div className="sm:col-span-2 space-y-2">
              <Label>Highlights</Label>
              {form.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={highlight}
                    onChange={(event) =>
                      set(
                        'highlights',
                        form.highlights.map((h, i) => (i === index ? event.target.value : h))
                      )
                    }
                    placeholder="Handwoven in Kerala"
                  />
                  <button
                    type="button"
                    onClick={() => set('highlights', form.highlights.filter((_, i) => i !== index))}
                    className={adminDangerIconButton}
                    aria-label="Remove highlight"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set('highlights', [...form.highlights, ''])}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add highlight
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6">
        <Panel title="Visibility">
          <div className="p-4 space-y-3">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onChange={(value) => set('is_active', value)}
              label="Active"
              hint="Uncheck to hide it from the shop without deleting it"
            />
            <Checkbox
              id="is_new"
              checked={form.is_new}
              onChange={(value) => set('is_new', value)}
              label="New arrival"
              hint="Shows a New badge on the product card"
            />
            <Checkbox
              id="is_bestseller"
              checked={form.is_bestseller}
              onChange={(value) => set('is_bestseller', value)}
              label="Bestseller"
              hint="Bestsellers are ranked first on the homepage"
            />
          </div>
        </Panel>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saving} className={adminPrimaryButton}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>

        {isEdit && (
          <Panel title="Danger zone">
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-3">
                Products that appear in past orders can&apos;t be deleted — deactivate them instead
                so order history stays intact.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {deleting ? 'Deleting…' : 'Delete product'}
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </form>
  )
}
