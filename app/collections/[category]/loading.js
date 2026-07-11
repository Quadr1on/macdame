import Navbar from '@/components/Navbar'

// Streams instantly on navigation so the collection switch never feels frozen.
export default function CollectionLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <main className="pb-16">
        {/* Hero placeholder */}
        <div className="h-[46vh] min-h-[340px] bg-gray-200 animate-pulse" />
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col lg:flex-row gap-8 animate-pulse">
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                <div className="h-5 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-2 bg-gray-200 rounded-full" />
                <div className="flex justify-between">
                  <div className="h-3 w-10 bg-gray-200 rounded" />
                  <div className="h-3 w-14 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden">
                    <div className="aspect-[3/4] bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-5 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
