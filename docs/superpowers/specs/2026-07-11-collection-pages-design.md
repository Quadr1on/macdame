# Men / Women / Kids Collection Pages — Design

Date: 2026-07-11
Status: Approved by user (approach A, hero + grid, reuse PNGs, move sarees → Women)

## Goal

DB-driven collection landing pages at `/collections/men`, `/collections/women`,
`/collections/kids`, reusing the existing shop/product patterns. Product detail
pages already work dynamically via `/products/[slug]` — seeded products get
them for free. Smooth framer-motion microinteractions on every interactive
element.

## Scope

- In: the three category pages, seed data, one data-layer function, shared
  page template.
- Out (explicitly deferred): `/collections` index, `/collections/uniforms`,
  fixing hardcoded homepage `Collections.jsx` hrefs (`/collections/sarees`,
  `/mens`, `/bridal`, `/festive`, `/new` still 404).

## Data & seeding (no DDL — schema already fits)

Tables `categories(name, slug, image_url, description)` and
`products(category_id, …)` + `product_variants` already exist. One data
migration:

1. Insert categories `men`, `women`, `kids` (description doubles as hero
   tagline; `image_url` from existing `/public` PNGs).
2. Re-point the 8 existing sarees to `women`; delete old `Sarees` category row.
3. Seed products (existing column shape, images mapped from existing PNGs,
   each with 1–3 variants for sizes/stock):
   - Men (5): Kasavu Mundu, Silk Veshti + Angavastram, Cotton Set Mundu,
     Shirt & Dhoti set, Festive Silk Dhoti.
   - Women (+3): White & Gold Churidar Saree, Kasavu Churidar Set,
     Gold-Border Churidar Material → 11 total with the sarees.
   - Kids (6): Boys' Lungi, Kids' Mundu, Junior Veshti Set, Gopi Dress,
     Kasavu Pattu Pavadai, Kurta-Mundu set.

## Data layer

`lib/products.js` gains `getCategoryWithProducts(slug)` →
`{ category: {name, slug, description, image}, products: mapProduct[] } | null`.
Same `SELECT`/`mapProduct` as existing functions.

## Routes & components

```
app/collections/[category]/page.js            server: fetch, notFound(), generateMetadata
app/collections/[category]/CollectionContent.jsx  client: hero + filter + grid
```

- Hero band: category image background, name + tagline, cream/gold treatment.
- Below: price-filter sidebar + `ProductCard` grid (same as `/shop`).
- Microinteractions: staggered grid entrance, hero fade/slide, filter and
  hover transitions via framer-motion; `motion-reduce` respected.

## Error handling

- Unknown slug / fetch error → `notFound()`.
- Empty category → hero + "coming soon" empty state.

## Verification

Browser-verified per page (products render, detail page opens, cart works,
mobile layout). Push to GitHub after each page is verified.
