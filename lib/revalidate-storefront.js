import { revalidatePath } from 'next/cache'

/**
 * Drops the cached storefront pages after a catalogue change in /admin.
 *
 * The shop pages are statically cached and refreshed every 5 minutes
 * (`revalidate = 300`). Without this, a product added, edited, hidden or
 * deleted in /admin would keep showing the old catalogue until the next
 * background refresh — which looks exactly like hardcoded products.
 */
export function revalidateStorefront() {
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/collections/[category]', 'page')
  revalidatePath('/products/[slug]', 'page')
}
