import { createClient } from '@supabase/supabase-js'

// Cookie-free client for public catalog reads (products, categories).
// The cookie-bound client in server.js calls next/headers cookies(), which
// forces every page using it into fully dynamic rendering — catalog pages
// were re-querying Supabase on every navigation. Public data doesn't need
// the user's session, and keeping cookies out lets Next cache these pages.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
