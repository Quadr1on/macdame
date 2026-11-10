import Navbar from '@/components/Navbar'

// Streams instantly on navigation so the collection switch never feels frozen:
// the full-screen hero's ground, then the grid's shape.
export default function CollectionLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main>
        <div className="h-svh min-h-[560px] animate-pulse bg-[var(--color-primary-dark)]" />
        <div className="page-wrap py-16 lg:py-24">
          <div className="animate-pulse">
            <div className="h-10 w-72 rounded bg-[var(--color-cream-dark)]" />
            <div className="mt-8 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 w-28 rounded-full bg-[var(--color-cream-dark)]" />
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-white">
                  <div className="aspect-[3/4] bg-[var(--color-cream-dark)]" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-3/4 rounded bg-[var(--color-cream-dark)]" />
                    <div className="h-4 w-1/3 rounded bg-[var(--color-cream-dark)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
