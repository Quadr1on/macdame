const SRC = 'https://checkout.razorpay.com/v1/checkout.js'
const LOAD_TIMEOUT_MS = 15000

/**
 * Resolves with the Razorpay constructor, loading the checkout script on first
 * use. Deliberately keyed off `window.Razorpay` rather than a React state flag:
 * next/script's `onLoad` only fires the first time a src loads, so any remount
 * (auth resolving, navigating back from the address book) would otherwise leave
 * the page believing the gateway is still loading forever.
 */
export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout can only load in the browser'))
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timed out loading Razorpay checkout')),
      LOAD_TIMEOUT_MS
    )

    const settle = () => {
      clearTimeout(timeout)
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay checkout loaded but exposed no constructor'))
    }
    const fail = () => {
      clearTimeout(timeout)
      reject(new Error('Failed to load Razorpay checkout'))
    }

    // A tag may already be in flight (React remount, or a previous attempt).
    const existing = document.querySelector(`script[src="${SRC}"]`)
    if (existing) {
      existing.addEventListener('load', settle)
      existing.addEventListener('error', fail)
      return
    }

    const el = document.createElement('script')
    el.src = SRC
    el.async = true
    el.addEventListener('load', settle)
    el.addEventListener('error', fail)
    document.body.appendChild(el)
  })
}
