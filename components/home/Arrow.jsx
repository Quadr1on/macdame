// The drawn arrow used by the dealt "arrow" buttons and head-row links. Drawn
// rather than a font glyph so every face shows the same mark.
export default function Arrow({ className = 'btn-arrow' }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M1.5 6h8.5M6.5 2.5 10 6l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
