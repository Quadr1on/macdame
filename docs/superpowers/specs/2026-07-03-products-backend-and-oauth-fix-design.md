# Products Backend Integration + Google OAuth Callback Fix

_Date: 2026-07-03_

## Context

The app currently has two backend gaps, identified in `BACKEND_STATUS.md`:

1. **Products** are fully hardcoded in `lib/products-data.js`, with a comment admitting this is a temporary stub ("in production, this would come from Supabase"). No Supabase product queries exist anywhere.
2. **Google OAuth** is mostly wired (`lib/auth-context.js` has real sign-up/sign-in/sign-out/session-listener logic), but `app/auth/callback/` is an empty directory with no route handler — so the OAuth code exchange has nowhere to land, breaking Google sign-in end-to-end.

Today's goal is to close both gaps: move products onto a real Supabase table (seeded with the current dummy data, so app behavior is unchanged), and fix Google OAuth by implementing the callback route properly.

Note: my Supabase MCP connection cannot reach the project this app actually uses (`.env.local` points to ref `dzfynmkoqtlsesasutge`; MCP only sees an unrelated project, `Smartcare-bot`). So the products migration will be delivered as a SQL file for the user to run manually against the real project, not applied via MCP.

## Part 1 — Products Backend

### Schema

New `products` table, mirroring the fields in `lib/products-data.js`:

| Column | Type | Notes |
|---|---|---|
| `id` | `int4` (primary key) | matches existing ids 1-8, no identity/serial needed since we're seeding fixed ids |
| `name` | `text` | |
| `price` | `numeric` | rupees, plain number |
| `original_price` | `numeric` | |
| `image` | `text` | primary/cover image path |
| `images` | `jsonb` | array of image paths |
| `rating` | `numeric` | |
| `reviews` | `int4` | |
| `is_new` | `boolean` | |
| `is_bestseller` | `boolean` | |
| `sku` | `text` | |
| `sizes` | `jsonb` | array of strings |
| `color` | `text` | |
| `material` | `text` | |
| `work` | `text` | |
| `wash_care` | `text` | |
| `items_included` | `text` | |
| `description` | `text` | |
| `highlights` | `jsonb` | array of strings |
| `recent_views` | `int4` | |

`href` is **not** stored — it's always `/products/${id}` and is derived in code, not persisted as data.

### RLS

- Enable RLS on `products`.
- Add a public `SELECT` policy (`USING (true)`) so anyone — including anonymous/unauthenticated visitors — can read the product catalog.
- No insert/update/delete policy for `anon`/`authenticated` roles — the table is read-only from the app's perspective for now.

### Migration file

`supabase/migrations/<timestamp>_create_products_table.sql`, containing:
- `CREATE TABLE products (...)` with the schema above
- `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`
- the public-read policy
- `INSERT INTO products (...) VALUES (...)` for all 8 dummy sarees currently in `lib/products-data.js`, preserving their exact field values and ids

The user runs this manually (Supabase SQL editor or CLI) against the real project — it will not be applied via MCP.

### Application code changes

- **New `lib/products.js`**: exports `getAllProducts()` and `getProductById(id)`, both async, both querying `supabase.from('products').select('*')` (the latter with `.eq('id', id).single()`).
- **`app/products/[id]/page.js`**: replace `import allProducts from '@/lib/products-data'` + `allProducts.find(...)` with `await getProductById(id)`. This file has no client-only concerns visible so far — confirm during planning whether it's a server component; if so this is a direct swap.
- **`app/shop/page.jsx`**: replace the `products-data.js` import with `getAllProducts()`. This page has client-side filtering (Radix slider), so during planning we must check whether the whole page is `'use client'`:
  - If the page is a server component with filtering handled in a child client component, fetch happens directly in the page and gets passed down as a prop — simplest case.
  - If the page itself must be `'use client'` for the filter state, fetching must happen either in a server parent/layout that passes products down as props, or via a client-side Supabase call inside a `useEffect`. Prefer the server-parent-passes-props pattern to keep data fetching server-side and avoid an extra client-side round trip.
- **Delete `lib/products-data.js`** once no file imports it anymore.

### Verification

- `npm run dev`, load `/shop` — confirm all 8 products render with identical data (name, price, images, badges) to before the change.
- Confirm the price-range filter still works against fetched data.
- Load a `/products/[id]` page for a couple of different ids — confirm full detail data (description, highlights, sizes, etc.) renders correctly.
- Confirm `npm run build` succeeds (no leftover imports of the deleted `products-data.js`).

## Part 2 — Google OAuth Callback Fix

### Why the current setup breaks

`lib/supabase.js` uses `createClient` from `@supabase/supabase-js` (a browser-only client with no cookie/session-persistence strategy for server rendering). `signInWithGoogle()` in `lib/auth-context.js` calls `signInWithOAuth({ provider: 'google' })` with no `redirectTo`, and even if the redirect were set correctly, `app/auth/callback/` has no handler to receive the `code` param and exchange it for a session. The flow has nowhere to land.

### Approach: full `@supabase/ssr` setup

Add the `@supabase/ssr` package and adopt the standard Next.js App Router Supabase pattern:

1. **`lib/supabase/client.js`** — browser client via `createBrowserClient(url, anonKey)`. Used in client components (replaces current `lib/supabase.js` usage in `auth-context.js`).
2. **`lib/supabase/server.js`** — server client via `createServerClient(url, anonKey, { cookies })`, reading/writing cookies through `next/headers`. Used in server components and route handlers.
3. **`middleware.js`** (repo root) — runs on every request, creates a server client bound to the request/response cookies, calls `supabase.auth.getUser()` to refresh the session token, and returns the response with updated cookies. Uses the standard Supabase `updateSession` matcher pattern, excluding static assets.
4. **`app/auth/callback/route.js`** — `GET` handler:
   - reads `code` from the URL search params (and optional `next` param for post-login redirect target, defaulting to `/`)
   - calls `await supabase.auth.exchangeCodeForSession(code)` using the server client
   - on success, redirects to `next` (or `/`)
   - on failure, redirects to `/auth/auth-code-error` (existing page)
5. **`lib/auth-context.js`**: swap `import { supabase } from './supabase'` to `import { supabase } from './supabase/client'`; add `options: { redirectTo: `${window.location.origin}/auth/callback` }` to the `signInWithOAuth` call in `signInWithGoogle`.
6. **Remove `lib/supabase.js`** (the old placeholder-fallback client) once nothing imports it — replaced entirely by the client/server split.

Placeholder-fallback behavior (silently using fake URL/key when env vars are missing) is dropped in the new clients — if env vars are missing, `createBrowserClient`/`createServerClient` will throw, which is preferable to silently limping along with fake credentials.

### Verification

- `npm run dev`, click "Sign in with Google" from the login page.
- Confirm redirect lands on `/auth/callback`, then bounces to `/` (or wherever `next` points) fully signed in — no landing on `auth-code-error`.
- Confirm a `users_profile` row is created/updated for the Google-authenticated user (existing `createUserProfile` logic in `auth-context.js` should fire unchanged via `onAuthStateChange`).
- Confirm existing email/password sign-up/sign-in still works unchanged after the client swap.
- Confirm `npm run build` succeeds.

## Out of scope

- Payments/checkout — not touched.
- Cart — stays local-only (Zustand + localStorage), unchanged.
- Replacing dummy product data with real inventory — this pass only moves the *same* 8 products into Supabase; content is still placeholder.
