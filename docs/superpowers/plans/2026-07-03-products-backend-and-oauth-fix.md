# Products Backend Integration + OAuth Callback Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move product data from a hardcoded JS file onto a real Supabase `products` table (seeded with the same 8 dummy sarees), and fix Google OAuth sign-in by implementing the missing `/auth/callback` route with a proper `@supabase/ssr` client split.

**Architecture:** Split the single ad-hoc `lib/supabase.js` browser client into a browser client (`lib/supabase/client.js`) and a server client (`lib/supabase/server.js`) per the standard `@supabase/ssr` Next.js App Router pattern, add `middleware.js` to refresh session cookies, and add `app/auth/callback/route.js` to complete the OAuth code exchange. Convert `app/shop/page.jsx` and `app/products/[id]/page.js` from client-only components into server components that fetch from Supabase and pass data down to new `*Client.jsx` presentational components that keep all existing interactivity (filtering, image gallery, add-to-cart) unchanged.

**Tech Stack:** Next.js 16 (App Router) with React 19, `@supabase/supabase-js` (already installed), `@supabase/ssr` (new dependency), Zustand (cart, untouched), Tailwind v4.

## Global Constraints

- No test runner is configured in this repo (per `CLAUDE.md`) — verification steps in this plan use `npm run build`, `npm run lint`, and manual browser checks via `npm run dev` instead of automated test-first steps.
- Product prices are stored in rupees as plain numbers (existing convention, keep it).
- Components using auth, cart, or client-side hooks must be marked `'use client'` (existing convention).
- The macdame Supabase project (ref `dzfynmkoqtlsesasutge`, from `.env.local`) is **not** reachable via the available Supabase MCP tool — the products SQL migration must be written to a file for the user to run manually (Supabase SQL editor or CLI), not applied via MCP.
- Commit after every task (per user instruction to commit as we proceed).
- `app/auth/auth-code-error/page.js` already exists and does not need to change.

---

### Task 1: Add `@supabase/ssr` and create browser + server Supabase clients

**Files:**
- Modify: `package.json` (add dependency)
- Create: `lib/supabase/client.js`
- Create: `lib/supabase/server.js`

**Interfaces:**
- Produces: `lib/supabase/client.js` exports `createClient()` — call it to get a browser Supabase client instance (function, not a singleton, per `@supabase/ssr` convention).
- Produces: `lib/supabase/server.js` exports `async function createClient()` — call it (with `await`) inside server components/route handlers to get a server Supabase client bound to the current request's cookies.

- [ ] **Step 1: Install `@supabase/ssr`**

Run: `npm install @supabase/ssr`
Expected: `package.json` gains `"@supabase/ssr": "^<version>"` under `dependencies`, `package-lock.json` updates, no errors.

- [ ] **Step 2: Create the browser client**

Create `lib/supabase/client.js`:

```js
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

- [ ] **Step 3: Create the server client**

Create `lib/supabase/server.js`:

```js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component without a mutable
            // cookie store (e.g. during render) — safe to ignore because
            // middleware refreshes the session on every request anyway.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds (these two files aren't imported anywhere yet, so this just confirms no syntax errors).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/supabase/client.js lib/supabase/server.js
git commit -m "feat: add @supabase/ssr browser and server clients"
```

---

### Task 2: Add middleware to refresh the Supabase session on every request

**Files:**
- Create: `middleware.js` (repo root, alongside `package.json`)

**Interfaces:**
- Consumes: `@supabase/ssr`'s `createServerClient` directly (not `lib/supabase/server.js`, since middleware needs to mutate the `NextResponse` cookies as it goes, which the request-scoped `cookies()` helper from Task 1 doesn't support).

- [ ] **Step 1: Create the middleware**

Create `middleware.js`:

```js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the auth token if expired — required for Server Components,
  // which can't write cookies themselves.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Verify the app still runs**

Run: `npm run dev` (in background or a separate terminal), then load `http://localhost:3000/` in a browser.
Expected: homepage loads normally, no middleware errors in the terminal output. Stop the dev server after checking.

- [ ] **Step 3: Commit**

```bash
git add middleware.js
git commit -m "feat: add middleware to refresh Supabase session cookies"
```

---

### Task 3: Add the OAuth callback route handler

**Files:**
- Create: `app/auth/callback/route.js`

**Interfaces:**
- Consumes: `lib/supabase/server.js`'s `async createClient()` from Task 1.
- Consumes: `app/auth/auth-code-error/page.js` (existing, unchanged) as the failure redirect target.

- [ ] **Step 1: Create the route handler**

Create `app/auth/callback/route.js`:

```js
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds, `app/auth/callback` shows up as a route in the build output (as a dynamic function/route handler, not a static page).

- [ ] **Step 3: Commit**

```bash
git add app/auth/callback/route.js
git commit -m "feat: implement OAuth callback route to complete Google sign-in"
```

---

### Task 4: Point auth-context at the new browser client and fix the OAuth redirect

**Files:**
- Modify: `lib/auth-context.js:1-3` (import), `lib/auth-context.js:115-126` (`signInWithGoogle`)
- Delete: `lib/supabase.js`

**Interfaces:**
- Consumes: `lib/supabase/client.js`'s `createClient()` from Task 1.

- [ ] **Step 1: Swap the import and client instantiation**

In `lib/auth-context.js`, replace:

```js
import { supabase } from './supabase'
```

with:

```js
import { createClient } from './supabase/client'

const supabase = createClient()
```

(Place the `createClient()` call at module scope, right after the imports, so the rest of the file's `supabase.auth.*` / `supabase.from(...)` calls are untouched.)

- [ ] **Step 2: Set the OAuth redirect target**

In `lib/auth-context.js`, replace the `signInWithGoogle` function body:

```js
  async function signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
```

with:

```js
  async function signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
```

- [ ] **Step 3: Delete the old placeholder-fallback client**

Delete `lib/supabase.js` (confirmed in exploration that `lib/auth-context.js` was its only importer, and step 1 removed that import).

Run: `grep -rn "from '\\./supabase'" lib/ app/ components/` (or equivalent search) to confirm no remaining references before deleting.

- [ ] **Step 4: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds with no "module not found" errors for `lib/supabase.js`.

- [ ] **Step 5: Manual verification — email/password auth unaffected**

Run: `npm run dev`, go to `/login`, sign in with an existing email/password test account (or `/signup` to create one).
Expected: sign-in succeeds and redirects to `/`, same as before this change.

- [ ] **Step 6: Manual verification — Google OAuth end-to-end**

From `/login`, click "Continue with Google", complete the Google consent screen.
Expected: browser redirects through `/auth/callback` and lands back on `/` fully signed in (not on `/auth/auth-code-error`). Confirm via Supabase dashboard or by checking `users_profile` table that a row was created/updated for the signed-in user.

- [ ] **Step 7: Commit**

```bash
git add lib/auth-context.js
git rm lib/supabase.js
git commit -m "fix: complete Google OAuth flow via new SSR client and callback redirect"
```

---

### Task 5: Write the products table SQL migration (table + RLS + seed data)

**Files:**
- Create: `supabase/migrations/20260703120000_create_products_table.sql`

**Interfaces:**
- Produces: a `public.products` table with columns `id, name, price, original_price, image, images, rating, reviews, is_new, is_bestseller, sku, sizes, color, material, work, wash_care, items_included, description, highlights, recent_views` — this exact column set is what Task 6's `lib/products.js` selects and maps from.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260703120000_create_products_table.sql`:

```sql
create table public.products (
  id integer primary key,
  name text not null,
  price numeric not null,
  original_price numeric,
  image text not null,
  images jsonb not null default '[]'::jsonb,
  rating numeric,
  reviews integer default 0,
  is_new boolean default false,
  is_bestseller boolean default false,
  sku text,
  sizes jsonb not null default '[]'::jsonb,
  color text,
  material text,
  work text,
  wash_care text,
  items_included text,
  description text,
  highlights jsonb not null default '[]'::jsonb,
  recent_views integer default 0
);

alter table public.products enable row level security;

create policy "Public read access to products"
  on public.products
  for select
  to anon, authenticated
  using (true);

insert into public.products
  (id, name, price, original_price, image, images, rating, reviews, is_new, is_bestseller, sku, sizes, color, material, work, wash_care, items_included, description, highlights, recent_views)
values
  (1, 'Kerala Kasavu Saree', 2499, 3499, '/product-kasavu-saree.png',
   '["/product-kasavu-saree.png","/product-bridal-saree.png","/product-set-mundu.png","/collection-sarees.png"]'::jsonb,
   4.8, 124, true, false, 'MD-KKS-001', '["Free Size"]'::jsonb,
   'Off White & Gold', 'Pure Cotton with Kasavu Border', 'Handloom Weave', 'Gentle hand wash or dry clean', 'Saree with attached blouse piece',
   'This elegant Kerala Kasavu saree embodies timeless beauty with its pristine off-white fabric and gleaming golden border. Handcrafted by skilled artisans from the looms of Kerala, each piece is a masterwork of traditional weaving. The luxurious kasavu zari border adds a touch of regality, making it perfect for festivals, weddings, and celebrations. The soft cotton fabric ensures all-day comfort while maintaining an effortlessly graceful drape.',
   '["Authentic Kerala handloom product","Pure cotton body with real kasavu zari","Traditional mundu-style golden border","Breathable and comfortable for all-day wear"]'::jsonb,
   1014),

  (2, 'Kanchipuram Silk Saree', 8999, 12999, '/product-kasavu-saree.png',
   '["/product-bridal-saree.png","/product-kasavu-saree.png","/collection-festive.png","/collection-sarees.png"]'::jsonb,
   4.9, 89, false, true, 'MD-KSS-002', '["Free Size"]'::jsonb,
   'Royal Magenta & Gold', 'Pure Mulberry Silk', 'Zari Weave with Temple Border', 'Dry clean only', 'Saree with unstitched blouse fabric',
   'A magnificent Kanchipuram silk saree that epitomizes South Indian grandeur. Woven with the finest mulberry silk threads intertwined with real zari, this saree features the iconic temple border pattern that has been a hallmark of Kanchipuram weaving for centuries. The rich magenta hue paired with intricate gold motifs creates a stunning visual masterpiece perfect for bridal trousseaus and grand occasions.',
   '["Authentic Kanchipuram GI tagged product","Pure mulberry silk with real zari","Iconic temple border design","Comes with contrast blouse piece"]'::jsonb,
   2347),

  (3, 'Banarasi Silk Saree', 15999, 19999, '/product-kasavu-saree.png',
   '["/collection-festive.png","/product-bridal-saree.png","/product-kasavu-saree.png","/collection-sarees.png"]'::jsonb,
   4.7, 156, false, true, 'MD-BSS-003', '["Free Size"]'::jsonb,
   'Deep Maroon & Antique Gold', 'Pure Banarasi Silk', 'Kadwa Weave with Meenakari', 'Dry clean only', 'Saree with unstitched blouse fabric',
   'An exquisite Banarasi silk saree that is the crown jewel of any collection. Handwoven in the ancient city of Varanasi using the traditional kadwa weave technique, this masterpiece features intricate meenakari work with floral jaal patterns across the body. The deep maroon color symbolizes auspiciousness and celebration, making it an ideal choice for weddings, pujas, and grand festivities.',
   '["Handwoven in Varanasi by master weavers","Authentic kadwa weave (not machine-cut)","Meenakari work with gold & silver zari","Heavy pallu with elaborate motifs"]'::jsonb,
   876),

  (4, 'Cotton Handloom Saree', 1299, 1799, '/product-kasavu-saree.png',
   '["/product-set-mundu.png","/product-kasavu-saree.png","/collection-new.png","/collection-sarees.png"]'::jsonb,
   4.5, 78, true, false, 'MD-CHS-004', '["Free Size"]'::jsonb,
   'Indigo Blue & White', 'Pure Handloom Cotton', 'Block Print', 'Gentle machine wash, cold water', 'Saree with unstitched blouse fabric',
   'A beautifully crafted cotton handloom saree that celebrates the art of traditional Indian block printing. The rich indigo blue base is adorned with delicate white geometric and floral patterns, each stamped by hand using carved wooden blocks. Lightweight and breathable, this saree is your perfect companion for daily elegance, office wear, or casual outings.',
   '["Hand block printed with natural dyes","Lightweight and breathable cotton","Perfect for daily and semi-formal wear","Eco-friendly production process"]'::jsonb,
   543),

  (5, 'Mysore Silk Saree', 5999, 7999, '/product-kasavu-saree.png',
   '["/collection-sarees.png","/product-bridal-saree.png","/product-kasavu-saree.png","/collection-festive.png"]'::jsonb,
   4.6, 112, false, false, 'MD-MSS-005', '["Free Size"]'::jsonb,
   'Emerald Green & Gold', 'Pure Mysore Silk (Crepe)', 'Zari Border Weave', 'Dry clean recommended', 'Saree with unstitched blouse fabric',
   'The Mysore Silk saree is renowned for its understated elegance and incredible softness. Made from pure Mysore crepe silk with a distinctive sheen, this emerald green beauty features a tasteful gold zari border. The smooth texture and beautiful drape make it a favorite among discerning women who appreciate subtle luxury. A GI-tagged product from the royal looms of Karnataka.',
   '["GI-tagged Mysore Silk","Pure crepe silk with natural sheen","Lightweight with excellent drape","Subtle zari border for understated elegance"]'::jsonb,
   728),

  (6, 'Pochampally Ikat Saree', 4499, 5999, '/product-kasavu-saree.png',
   '["/collection-new.png","/product-set-mundu.png","/product-kasavu-saree.png","/collection-sarees.png"]'::jsonb,
   4.4, 67, true, false, 'MD-PIS-006', '["Free Size"]'::jsonb,
   'Teal & Coral Multi', 'Handloom Silk Cotton', 'Double Ikat Weave', 'Dry clean only', 'Saree with unstitched blouse fabric',
   'A stunning Pochampally Ikat saree featuring the mesmerizing double-ikat technique from Telangana. Both the warp and weft threads are resist-dyed before weaving, creating the signature blurred-edge geometric patterns that are impossible to replicate by machine. The vibrant teal and coral palette brings a contemporary flair to this centuries-old art form.',
   '["Authentic Pochampally double ikat","UNESCO Intangible Heritage craft","Each piece is unique due to handmade process","Contemporary colors with traditional technique"]'::jsonb,
   392),

  (7, 'Chanderi Silk Saree', 3999, 4999, '/product-kasavu-saree.png',
   '["/product-kasavu-saree.png","/collection-festive.png","/product-bridal-saree.png","/collection-sarees.png"]'::jsonb,
   4.7, 93, false, true, 'MD-CSS-007', '["Free Size"]'::jsonb,
   'Pastel Pink & Silver', 'Chanderi Silk Cotton', 'Zari Buttis with Border', 'Gentle hand wash or dry clean', 'Saree with unstitched blouse fabric',
   'A delicate Chanderi silk saree that is a symbol of Madhya Pradesh''s weaving heritage. Known for its sheer texture and lightweight feel, this pastel pink beauty is adorned with shimmering silver zari buttis scattered across the body. The gossamer-like fabric drapes beautifully and is perfect for summer celebrations, festivals, and elegant daytime events.',
   '["Authentic Chanderi from Madhya Pradesh","Signature sheer texture and lightweight","Silver zari buttis with border","Perfect for summer and festive occasions"]'::jsonb,
   651),

  (8, 'Paithani Silk Saree', 18999, 24999, '/product-kasavu-saree.png',
   '["/product-bridal-saree.png","/collection-festive.png","/product-kasavu-saree.png","/collection-sarees.png"]'::jsonb,
   4.9, 45, false, true, 'MD-PSS-008', '["Free Size"]'::jsonb,
   'Wine Purple & Gold', 'Pure Paithani Silk', 'Peacock Pallu with Muniya Border', 'Dry clean only', 'Saree with unstitched blouse fabric',
   'A breathtaking Paithani silk saree from Paithan, Maharashtra — often called the "Queen of Sarees." This wine purple masterpiece features the iconic peacock motif on the pallu, meticulously woven by hand using the tapestry weave technique. The muniya (parrot) border adds another layer of artistry. Each Paithani takes months to complete, making it a true heirloom piece worthy of passing down through generations.',
   '["Handwoven in Paithan, Maharashtra","Iconic peacock pallu design","Tapestry weave technique – months to make","Heirloom quality investment piece"]'::jsonb,
   1203);
```

- [ ] **Step 2: Ask the user to run the migration**

This migration cannot be applied via the available Supabase MCP tool (it only sees an unrelated project). Tell the user to run this file against the macdame project (ref `dzfynmkoqtlsesasutge`) via the Supabase SQL editor or `supabase db push` with the CLI, and confirm back once done — Tasks 6-8 depend on the `products` table existing to verify against.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260703120000_create_products_table.sql
git commit -m "feat: add products table migration with seeded dummy data"
```

---

### Task 6: Create `lib/products.js` data-access functions

**Files:**
- Create: `lib/products.js`

**Interfaces:**
- Consumes: `lib/supabase/server.js`'s `async createClient()` from Task 1, and the `products` table schema from Task 5.
- Produces: `async function getAllProducts()` → returns `Array<Product>` (empty array on error, logs the error).
- Produces: `async function getProductById(id)` → `id: number`, returns `Product | null` (`null` if not found or on error).
- Produces (shape of `Product`, used by Task 7 and 8's client components): `{ id, name, price, originalPrice, image, images, rating, reviews, isNew, isBestseller, href, sku, sizes, color, material, work, washCare, itemsIncluded, description, highlights, recentViews }` — camelCase, matching the exact shape `lib/products-data.js` used, with `href` derived as `/products/${id}`.

- [ ] **Step 1: Write `lib/products.js`**

Create `lib/products.js`:

```js
import { createClient } from '@/lib/supabase/server'

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price,
    image: row.image,
    images: row.images,
    rating: row.rating,
    reviews: row.reviews,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    href: `/products/${row.id}`,
    sku: row.sku,
    sizes: row.sizes,
    color: row.color,
    material: row.material,
    work: row.work,
    washCare: row.wash_care,
    itemsIncluded: row.items_included,
    description: row.description,
    highlights: row.highlights,
    recentViews: row.recent_views,
  }
}

export async function getAllProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select('*').order('id')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data.map(mapProduct)
}

export async function getProductById(id) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return mapProduct(data)
}
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds (not wired into any page yet).

- [ ] **Step 3: Commit**

```bash
git add lib/products.js
git commit -m "feat: add Supabase-backed products data access functions"
```

---

### Task 7: Convert the product detail page to fetch from Supabase

**Files:**
- Modify: `app/products/[id]/page.js` (rewrite as a server component)
- Create: `app/products/[id]/ProductPageClient.jsx` (existing client UI, now prop-driven)

**Interfaces:**
- Consumes: `getProductById(id)` from `lib/products.js` (Task 6).
- Consumes: `useCartStore` from `lib/cart-store.js` (unchanged, existing).

- [ ] **Step 1: Move the existing client component to `ProductPageClient.jsx`**

Copy the full current contents of `app/products/[id]/page.js` into a new file `app/products/[id]/ProductPageClient.jsx`, with these changes to the top of the file:

```js
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  Star, ShoppingBag, Heart, Share2, ChevronDown, ChevronUp,
  Truck, RotateCcw, ShieldCheck, Eye, Check, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react'
import useCartStore from '@/lib/cart-store'

export default function ProductPageClient({ product }) {
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [pincode, setPincode] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState(null) // null | 'available' | 'unavailable'
  const [showDetails, setShowDetails] = useState(true)
  const [showHighlights, setShowHighlights] = useState(true)

  const addItem = useCartStore((state) => state.addItem)
```

Changes made relative to the original file:
- Removed `import { use } from 'react'` from the React import line (now just `import { useState } from 'react'`) — no longer needed since `params` is resolved in the server parent.
- Removed `import allProducts from '@/lib/products-data'`.
- Renamed the exported function from `ProductPage({ params })` to `ProductPageClient({ product })`.
- Removed the two lines `const { id } = use(params)` and `const product = allProducts.find((p) => p.id === parseInt(id))` — `product` now arrives as a prop directly.

The rest of the file (everything from the `if (!product) { ... }` guard at the original line 33 through the closing `}` at the original line 533) is copied over **unchanged** — same JSX, same handlers, same `product.<field>` references, since `product` remains an object with the exact same shape.

- [ ] **Step 2: Rewrite `app/products/[id]/page.js` as a server component**

Replace the full contents of `app/products/[id]/page.js` with:

```js
import { getProductById } from '@/lib/products'
import ProductPageClient from './ProductPageClient'

export default async function ProductPage({ params }) {
  const { id } = await params
  const product = await getProductById(parseInt(id))

  return <ProductPageClient product={product} />
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: build succeeds, no unused-import or "use client" boundary errors.

- [ ] **Step 4: Manual verification (requires Task 5's migration already run)**

Run: `npm run dev`, visit `http://localhost:3000/products/1` through `/products/8`.
Expected: each page renders the same product data (name, price, images, description, highlights, sizes) as before this change. Visit `http://localhost:3000/products/999` (nonexistent id) and confirm the "Product not found" state still renders.

- [ ] **Step 5: Commit**

```bash
git add app/products/[id]/page.js app/products/[id]/ProductPageClient.jsx
git commit -m "feat: fetch product detail page from Supabase instead of hardcoded data"
```

---

### Task 8: Convert the shop listing page to fetch from Supabase

**Files:**
- Modify: `app/shop/page.jsx` (rewrite as a server component)
- Create: `app/shop/ShopPageClient.jsx` (existing client UI, now prop-driven)

**Interfaces:**
- Consumes: `getAllProducts()` from `lib/products.js` (Task 6).
- Consumes: `ProductCard` from `components/ProductCard.jsx` (unchanged, existing).

- [ ] **Step 1: Move the existing client component to `ShopPageClient.jsx`**

Copy the full current contents of `app/shop/page.jsx` into a new file `app/shop/ShopPageClient.jsx`, with these changes:

```js
'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'

const MIN_PRICE = 0
const MAX_PRICE = 20000

export default function ShopPageClient({ products }) {
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE])

  // Filter products based on price range
  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    )
  }, [products, priceRange])
```

Changes made relative to the original file:
- Removed `import allProducts from '@/lib/products-data'`.
- Renamed the exported function from `ShopPage()` to `ShopPageClient({ products })`.
- `filteredProducts` now filters the incoming `products` prop instead of the module-level `allProducts`, and the `useMemo` dependency array is `[products, priceRange]` instead of `[priceRange]`.

The rest of the file (everything from the `const handleClearFilters = ...` line through the closing `}`) is copied over **unchanged**.

- [ ] **Step 2: Rewrite `app/shop/page.jsx` as a server component**

Replace the full contents of `app/shop/page.jsx` with:

```js
import { getAllProducts } from '@/lib/products'
import ShopPageClient from './ShopPageClient'

export default async function ShopPage() {
  const products = await getAllProducts()

  return <ShopPageClient products={products} />
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual verification (requires Task 5's migration already run)**

Run: `npm run dev`, visit `http://localhost:3000/shop`.
Expected: all 8 products render, identical to before this change. Drag the price filter slider and confirm filtering still works against the fetched data.

- [ ] **Step 5: Commit**

```bash
git add app/shop/page.jsx app/shop/ShopPageClient.jsx
git commit -m "feat: fetch shop listing page from Supabase instead of hardcoded data"
```

---

### Task 9: Remove the now-unused hardcoded product data and do a final full-app check

**Files:**
- Delete: `lib/products-data.js`
- Modify: `CLAUDE.md:31` (the line describing `lib/products-data.js` as the product source)

**Interfaces:**
- None — this is cleanup only, no new interfaces.

- [ ] **Step 1: Confirm nothing still imports the old data file**

Run: `grep -rn "products-data" app/ components/ lib/`
Expected: no matches (Tasks 7 and 8 already removed the only two importers).

- [ ] **Step 2: Delete the file**

```bash
git rm lib/products-data.js
```

- [ ] **Step 3: Update `CLAUDE.md`'s Products description**

In `CLAUDE.md`, find the line under "State & Data":

```
- **Products**: `lib/products-data.js` holds hardcoded product objects (id, price, originalPrice, images[], sizes, description, highlights, etc.). Comment notes this should eventually come from Supabase. Shop page filtering and product detail pages both read from this file.
```

Replace it with:

```
- **Products**: `lib/products.js` exports `getAllProducts()`/`getProductById(id)`, which query the Supabase `products` table (see `supabase/migrations/`). `app/shop/page.jsx` and `app/products/[id]/page.js` are server components that fetch and pass data down to `ShopPageClient`/`ProductPageClient` for interactivity (filtering, image gallery, add-to-cart).
```

- [ ] **Step 4: Full verification pass**

Run: `npm run build`
Expected: succeeds, no errors.

Run: `npm run lint`
Expected: no new lint errors introduced by this plan's changes.

Run: `npm run dev` and walk through the full flow manually:
1. `/shop` — products load from Supabase, filter works.
2. Click into a product — detail page loads from Supabase, add to cart works, cart page (`/cart`, unchanged) shows the item.
3. `/login` — email/password sign-in works.
4. `/login` — "Continue with Google" completes and lands signed-in on `/`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: remove hardcoded products-data.js now that products are Supabase-backed"
```
