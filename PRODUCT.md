# Product

## Register

product

## Users

Shoppers in India (and the diaspora) buying traditional South Indian wear —
sarees, mundus, veshtis, kids' ethnic wear — for festivals, weddings and
school/bulk uniform needs. Mobile-heavy audience; many arrive from Instagram
(@mac_dame).

## Product Purpose

MacDame is an e-commerce storefront (Next.js + Supabase) for a real Kerala
clothing business. It exists to move browsing into carts: catalog pages by
category, dynamic product detail pages, cart and Google OAuth login. Success =
a shopper finds a piece, trusts the brand, and checks out without friction.

## Brand Personality

Heritage, handcrafted, warm. Kerala kasavu identity: cream surfaces, gold
accents, deep brown ink, Playfair serif display type. Confident but quiet —
the products (rich fabric photography) carry the drama.

## Anti-references

- Gradient decoration: gradient icon chips, gradient text. The owner has
  explicitly rejected these ("ugly gradient icons").
- Fake content: placeholder products, dead links, made-up stats. Everything
  visible must be DB-backed or clearly real.
- Generic SaaS landing tropes (hero-metric blocks, uppercase eyebrow labels).

## Design Principles

1. The fabric is the hero — UI stays quiet around imagery.
2. Everything dynamic — content comes from Supabase, not hardcoded arrays.
3. Motion is felt, not seen — smooth 300-500ms eases, staggered entrances,
   always with a reduced-motion path.
4. One template, many pages — shared dynamic routes over per-page forks.
5. Mobile is half the audience — 2-col grids, no overflow, 44px touch targets.

## Accessibility & Inclusion

No formal WCAG target declared; practical bar: AA contrast for text,
`prefers-reduced-motion` respected on all animation (MotionConfig +
motion-reduce utilities), keyboard-reachable dropdowns and forms.
