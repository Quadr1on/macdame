import { slugify } from './utils'

/**
 * Maps a collection form payload onto the categories table's columns.
 * Returns { fields } or { error }.
 */
export function normalizeCategory(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return { error: 'Collection name is required' }

  const slug = slugify(body?.slug) || slugify(name)
  if (!slug) return { error: 'Could not build a URL slug from that name' }

  const trim = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null)

  return {
    fields: {
      name,
      slug,
      description: trim(body?.description),
      image_url: trim(body?.image_url),
    },
  }
}
