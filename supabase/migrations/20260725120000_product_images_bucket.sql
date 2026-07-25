-- Storage bucket backing the admin dashboard's product image uploader.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public SELECT so next/image can fetch product photos anonymously, exactly
-- like the public read policies on products/categories.
--
-- There are deliberately NO insert/update/delete policies. Uploads run through
-- POST /api/admin/upload using the service role key, which bypasses RLS
-- entirely. A policy granting `authenticated` inserts would let any signed-in
-- customer write into the bucket, so the email allowlist stays the only gate.
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
