// Slides for the full-screen hero slideshow (components/home/HeroSlideshow).
// A slide is { src, alt, name, line, href, cta, pos, posPhone, crop }.

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// The shop's own photographs are square, so a full-screen crop needs a focal
// point per file. Anything not listed (a new upload from /admin) is centred.
const FOCUS = {
  '/hero-fullwidth.png': { pos: '50% 30%', posPhone: '42% 50%' },
  '/hero-banner.png': { pos: '50% 26%', posPhone: '50% 30%', crop: 1.3 }, // white bands down both edges
  '/collection-mens.png': { pos: '50% 38%', posPhone: '50% 50%' },
  '/collection-festive.png': { pos: '50% 50%', posPhone: '35% 50%' },
  '/collection-sarees.png': { pos: '50% 55%', posPhone: '62% 50%' },
  '/collection-new.png': { pos: '50% 40%', posPhone: '50% 50%' },
  '/product-bridal-saree.png': { pos: '50% 42%', posPhone: '50% 45%' },
  '/product-kasavu-saree.png': { pos: '50% 50%', posPhone: '50% 50%' },
  '/product-set-mundu.png': { pos: '50% 55%', posPhone: '45% 50%' },
}

const focus = (src) => FOCUS[src] ?? { pos: '50% 50%', posPhone: '50% 50%' }

export const HOME_SLIDES = [
  {
    src: '/hero-fullwidth.png',
    alt: 'A woman in a cream kasavu saree with a gold and magenta border, temple jewellery and jasmine in her hair',
    name: 'Women',
    line: 'Kasavu sarees with temple jewellery',
    href: '/collections/women',
    cta: 'Shop women',
  },
  {
    src: '/collection-mens.png',
    alt: 'Two men in cream kasavu shirts and mundus in a wood-panelled room',
    name: 'Men',
    line: 'Kasavu mundus, shirts and veshtis',
    href: '/collections/men',
    cta: 'Shop men',
  },
  {
    src: '/collection-festive.png',
    alt: 'Children’s festival silks in magenta, teal and orange laid out with jasmine and marigolds',
    name: 'Kids',
    line: 'Pattu pavadais and festival silks',
    href: '/collections/kids',
    cta: 'Shop kids',
  },
  {
    src: '/hero-banner.png',
    alt: 'A woman in a cream kasavu saree with a wide gold border on a wooden veranda',
    name: 'Kasavu sarees',
    line: 'Handloom cotton with a woven gold border',
    href: '/collections/women',
    cta: 'Shop sarees',
  },
  {
    src: '/product-bridal-saree.png',
    alt: 'A cream silk saree with a woven gold border draped on a wooden stand',
    name: 'Silk sarees',
    line: 'Kanchipuram, Mysore, Banarasi and Paithani silk',
    href: '/shop',
    cta: 'Shop all clothing',
  },
].map((s) => ({ ...focus(s.src), ...s }))

/**
 * The all-clothing page: one slide per collection that has pieces, its own
 * photograph, linking into it.
 */
export function buildShopSlides(collections = []) {
  // Collections with pieces first; if none have any yet (an empty catalogue),
  // every collection with a photo, so the hero still shows the shop.
  const withImage = collections.filter((c) => c.image)
  const stocked = withImage.filter((c) => c.itemCount > 0)
  return (stocked.length ? stocked : withImage)
    .map((c) => ({
      ...focus(c.image),
      src: c.image,
      alt: `${c.name}: ${c.description ?? 'collection'}`,
      name: c.name,
      line: c.description,
      href: c.href,
      cta: `Shop ${c.name.toLowerCase()}`,
    }))
}

/**
 * A collection page: the collection's own photograph first, then one slide for
 * each distinct product photograph in it (the first product that uses it, with
 * its name and price), so no picture shows twice. At most six.
 */
export function buildCollectionSlides(category, products = []) {
  const slides = []
  const seen = new Set()

  if (category.image) {
    seen.add(category.image)
    slides.push({
      ...focus(category.image),
      src: category.image,
      alt: `${category.name}: ${category.description ?? 'collection'}`,
      name: `The ${category.name.toLowerCase()} edit`,
      line: category.description,
      href: '#pieces',
      cta: products.length ? `See all ${products.length} pieces` : 'See the collection',
    })
  }

  for (const product of products) {
    for (const src of [product.image, ...(product.images ?? [])]) {
      if (!src || seen.has(src) || slides.length >= 6) continue
      seen.add(src)
      slides.push({
        ...focus(src),
        src,
        alt: product.name,
        name: product.name,
        line: [inr(product.price), product.material].filter(Boolean).join(' · '),
        href: product.href,
        cta: 'View piece',
      })
      break
    }
  }

  return slides
}
