import Navbar from '@/components/Navbar'

// Streams instantly on navigation so the user never stares at a frozen page
// while the product is fetched and rendered.
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-56 bg-gray-200 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
              <div className="space-y-5">
                <div className="h-8 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-7 w-40 bg-gray-200 rounded" />
                <div className="h-px bg-gray-200" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-10 w-16 bg-gray-200 rounded-lg" />
                  <div className="h-10 w-16 bg-gray-200 rounded-lg" />
                  <div className="h-10 w-16 bg-gray-200 rounded-lg" />
                </div>
                <div className="flex gap-3 pt-4">
                  <div className="h-13 flex-1 bg-gray-200 rounded-xl" />
                  <div className="h-13 flex-1 bg-gray-200 rounded-xl" />
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
