'use client'
import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Star, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Uploads images through /api/admin/upload and hands back their public URLs.
 *
 * value:    string[] of public URLs, in display order
 * onChange: (nextUrls: string[]) => void
 *
 * The first URL is the product's primary image (products.image), which is what
 * the shop grid and hero render — hence the reordering controls.
 */
export default function ImageUploader({ value = [], onChange, multiple = true, label = 'Images' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function uploadFiles(files) {
    const list = Array.from(files ?? [])
    if (list.length === 0) return

    setError('')
    setUploading(list.length)

    const uploaded = []
    for (const file of list) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(payload.error ?? `Failed to upload ${file.name}`)
          break
        }
        uploaded.push(payload.url)
      } catch {
        setError(`Failed to upload ${file.name}`)
        break
      } finally {
        setUploading((count) => count - 1)
      }
    }

    // Reset explicitly rather than relying on the per-file decrement: breaking
    // out early on an error leaves the unprocessed files uncounted.
    setUploading(0)

    if (uploaded.length > 0) {
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(-1))
    }
  }

  function move(index, delta) {
    const next = [...value]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function remove(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        {multiple && value.length > 0 && (
          <span className="text-xs text-slate-500">First image is the primary photo</span>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          uploadFiles(event.dataTransfer.files)
        }}
        className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
          dragging ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
        }`}
      >
        {value.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {value.map((url, index) => (
              <li
                key={url}
                className="group relative aspect-[3/4] overflow-hidden rounded border border-slate-200 bg-slate-100"
              >
                {/* Plain <img>: these URLs are user-supplied at runtime and the
                    thumbnails are tiny, so next/image optimisation buys nothing. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />

                {index === 0 && multiple && (
                  <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Primary
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-slate-900/70 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {multiple && (
                    <>
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                        aria-label="Move image earlier"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === value.length - 1}
                        className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                        aria-label="Move image later"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded p-1 text-white hover:bg-red-500/60"
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
          className="w-full"
        >
          {uploading > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading {uploading} image{uploading === 1 ? '' : 's'}…
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              {value.length > 0 ? 'Add more images' : 'Upload images'}
            </>
          )}
        </Button>

        <p className="mt-2 text-center text-xs text-slate-500">
          Drag and drop, or click to browse. JPEG, PNG, WebP, AVIF or GIF up to 5 MB each.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            uploadFiles(event.target.files)
            // Reset so re-picking the same file still fires onChange.
            event.target.value = ''
          }}
        />
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</p>
      )}
    </div>
  )
}
