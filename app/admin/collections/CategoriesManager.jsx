'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState, adminPrimaryButton, adminIconButton } from '@/components/admin/ui'
import ImageUploader from '@/components/admin/ImageUploader'
import { Plus, Pencil, ExternalLink, FolderTree } from 'lucide-react'
import { slugify } from '@/lib/utils'

const emptyForm = { name: '', slug: '', description: '', image_url: '' }

export default function CategoriesManager({ categories }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setSlugTouched(false)
    setError('')
    setOpen(true)
  }

  function openEdit(category) {
    setEditing(category)
    setForm({
      name: category.name ?? '',
      slug: category.slug ?? '',
      description: category.description ?? '',
      image_url: category.image_url ?? '',
    })
    setSlugTouched(true)
    setError('')
    setOpen(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(
      editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    )
    const payload = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(payload.error ?? 'Failed to save the collection')
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd} className={`gap-1.5 ${adminPrimaryButton}`}>
          <Plus className="h-4 w-4" />
          Add collection
        </Button>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg">
        {categories.length === 0 ? (
          <EmptyState>
            No collections yet. Add one before creating products — every product belongs to a
            collection.
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="px-4 text-slate-500">Collection</TableHead>
                <TableHead className="text-slate-500">URL</TableHead>
                <TableHead className="text-slate-500 text-right">Products</TableHead>
                <TableHead className="px-4 text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                        {category.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={category.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <FolderTree className="h-4 w-4 text-slate-300" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{category.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                          {category.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/collections/${category.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      /collections/{category.slug}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-600">
                    {category.productCount}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className={adminIconButton}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <p className="mt-3 text-xs text-slate-500">
        Collections can&apos;t be deleted here — products point at them, so removing one would
        orphan its catalog. Rename or repoint the products first if you need to retire a collection.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit collection' : 'Add collection'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="category_name">Name</Label>
              <Input
                id="category_name"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: slugTouched ? prev.slug : slugify(name),
                  }))
                }}
                placeholder="Uniforms"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_slug">URL slug</Label>
              <Input
                id="category_slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  setForm((prev) => ({ ...prev, slug: event.target.value }))
                }}
                placeholder="uniforms"
              />
              <p className="text-xs text-slate-500">
                /collections/{slugify(form.slug) || slugify(form.name) || '…'}
                {editing && ' — changing this breaks any existing links to the old URL.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_description">Description</Label>
              <Textarea
                id="category_description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Shown under the collection title on its landing page"
              />
            </div>

            <ImageUploader
              label="Cover image"
              multiple={false}
              value={form.image_url ? [form.image_url] : []}
              onChange={(urls) => setForm((prev) => ({ ...prev, image_url: urls[0] ?? '' }))}
            />

            <DialogFooter>
              <Button type="submit" disabled={saving} className={adminPrimaryButton}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add collection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
