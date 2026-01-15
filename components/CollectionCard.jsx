'use client'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CollectionCard({ collection }) {
  const {
    name = 'Kasavu Sarees',
    description = 'Traditional elegance for every occasion',
    image = '/collection-sarees.png',
    href = '/collections/sarees',
    itemCount = 50,
  } = collection || {}

  return (
    <Link 
      href={href}
      className="group relative block rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
    >
      {/* Background Image */}
      <div className="relative aspect-[4/5] md:aspect-[3/4]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 bg-[var(--color-secondary)]/90 text-white text-xs font-bold rounded-full">
              {itemCount}+ Items
            </span>
            
            <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-[var(--color-secondary)] transition-colors">
              {name}
            </h3>
            
            <p className="text-white/80 text-sm md:text-base line-clamp-2">
              {description}
            </p>
            
            <div className="flex items-center gap-2 text-white font-semibold pt-2 group-hover:text-[var(--color-secondary)] transition-colors">
              <span>Explore Collection</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
