# Backend Integration Status

_Last checked: 2026-07-03_

## Products — fully hardcoded, no backend

- `lib/products-data.js` exports a static array of 8 sarees, with a comment admitting *"in production, this would come from Supabase"*.
- Both `app/shop/page.jsx` and `app/products/[id]/page.js` import directly from that file.
- No `.from('products')` or any Supabase product query exists anywhere in the codebase.

## Auth — partially wired, real but broken at one critical step

- `lib/auth-context.js` is a genuine `AuthProvider`: email/password sign-up/sign-in, Google OAuth, sign-out, session listener, and it auto-upserts a `users_profile` row on sign-in. This part is real Supabase integration, not a stub.
- `.env.local` exists with `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` set, so it's configured.
- **Gap**: `app/auth/callback/` is an empty directory — no route handler to exchange the OAuth code for a session. Google login has nowhere to land after redirect, so that flow likely doesn't complete end-to-end right now. There's an error page (`auth-code-error`) but no success-path handler.
- Minor smell: `lib/supabase.js` falls back to placeholder URL/key strings if env vars are missing, instead of failing loudly.

## Cart — fully local, by design (not a gap)

- Pure Zustand + `persist` middleware to `localStorage` (`macdame-cart` key). No backend sync at all — matches the CLAUDE.md description, not an oversight.

## Payments/Checkout — doesn't exist yet

- No Stripe/payment SDK in `package.json`, no checkout route, nothing payment-related in the codebase at all.

## Bottom line

The only real backend integration so far is auth, and it's ~90% done but missing the OAuth callback handler that would make Google sign-in actually work. Everything else — products and cart — is local/hardcoded, and checkout hasn't been started.
