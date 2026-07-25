'use client'
import { useEffect, useState } from 'react'
import { supabasePublic } from './supabase/public'

// Shown until the real collections arrive, and kept as the fallback if the
// fetch fails. These three exist in the database today.
export const fallbackCollections = [
  { name: 'Men', href: '/collections/men' },
  { name: 'Women', href: '/collections/women' },
  { name: 'Kids', href: '/collections/kids' },
]

// The navbar and footer are client components rendered by every page, so they
// can't take server props. Cache the fetch in a module-level promise — the same
// trick lib/razorpay.js uses for the gateway script — so navigating around the
// site costs one request per browser session rather than one per page, shared
// across both components.
let collectionsPromise = null

function loadCollections() {
  collectionsPromise ??= supabasePublic
    .from('categories')
    .select('name, slug')
    .order('name')
    .then(({ data, error }) => {
      if (error || !data?.length) {
        collectionsPromise = null // let a later mount retry
        return fallbackCollections
      }
      return data.map((category) => ({
        name: category.name,
        href: `/collections/${category.slug}`,
      }))
    })

  return collectionsPromise
}

/**
 * Live list of `{ name, href }` collection links. Starts at the fallback so the
 * first paint is never empty, then swaps in whatever the database holds.
 */
export function useCollectionsMenu() {
  const [collections, setCollections] = useState(fallbackCollections)

  useEffect(() => {
    let cancelled = false
    loadCollections().then((items) => {
      if (!cancelled) setCollections(items)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return collections
}
