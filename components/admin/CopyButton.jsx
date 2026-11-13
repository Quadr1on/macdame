'use client'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

// Copies `text` to the clipboard and briefly confirms. Falls back to a plain
// "Couldn't copy" message where the Clipboard API is unavailable (non-HTTPS
// origins other than localhost, some in-app browsers).
export default function CopyButton({ text, label = 'Copy' }) {
  const [state, setState] = useState('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
    >
      {state === 'copied' ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Couldn’t copy' : label}
      </span>
    </button>
  )
}
