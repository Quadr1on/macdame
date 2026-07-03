-- Add columns needed to represent the existing dummy saree catalog on the
-- real `products` table (these fields have no home in the current schema).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS reviews int4,
  ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS work text,
  ADD COLUMN IF NOT EXISTS wash_care text,
  ADD COLUMN IF NOT EXISTS items_included text,
  ADD COLUMN IF NOT EXISTS highlights jsonb,
  ADD COLUMN IF NOT EXISTS recent_views int4;

-- Seed category (categories table is currently empty; products.category_id is a FK)
INSERT INTO categories (name, slug, description)
VALUES ('Sarees', 'sarees', 'Handloom and silk sarees from across India')
ON CONFLICT (slug) DO NOTHING;

-- Seed the 8 dummy sarees from lib/products-data.js
INSERT INTO products (
  category_id, name, slug, description, base_price, image, images,
  original_price, rating, reviews, is_new, is_bestseller,
  material, work, wash_care, items_included, highlights, recent_views
)
SELECT c.id, v.name, v.slug, v.description, v.base_price, v.image, v.images,
       v.original_price, v.rating, v.reviews, v.is_new, v.is_bestseller,
       v.material, v.work, v.wash_care, v.items_included, v.highlights, v.recent_views
FROM categories c, (VALUES
  ('Kerala Kasavu Saree', 'kerala-kasavu-saree',
   'This elegant Kerala Kasavu saree embodies timeless beauty with its pristine off-white fabric and gleaming golden border. Handcrafted by skilled artisans from the looms of Kerala, each piece is a masterwork of traditional weaving. The luxurious kasavu zari border adds a touch of regality, making it perfect for festivals, weddings, and celebrations. The soft cotton fabric ensures all-day comfort while maintaining an effortlessly graceful drape.',
   2499::numeric, '/product-kasavu-saree.png',
   '{"/product-kasavu-saree.png","/product-bridal-saree.png","/product-set-mundu.png","/collection-sarees.png"}'::text[],
   3499::numeric, 4.8::numeric, 124, true, false,
   'Pure Cotton with Kasavu Border', 'Handloom Weave', 'Gentle hand wash or dry clean', 'Saree with attached blouse piece',
   '["Authentic Kerala handloom product","Pure cotton body with real kasavu zari","Traditional mundu-style golden border","Breathable and comfortable for all-day wear"]'::jsonb,
   1014),

  ('Kanchipuram Silk Saree', 'kanchipuram-silk-saree',
   'A magnificent Kanchipuram silk saree that epitomizes South Indian grandeur. Woven with the finest mulberry silk threads intertwined with real zari, this saree features the iconic temple border pattern that has been a hallmark of Kanchipuram weaving for centuries. The rich magenta hue paired with intricate gold motifs creates a stunning visual masterpiece perfect for bridal trousseaus and grand occasions.',
   8999::numeric, '/product-kasavu-saree.png',
   '{"/product-bridal-saree.png","/product-kasavu-saree.png","/collection-festive.png","/collection-sarees.png"}'::text[],
   12999::numeric, 4.9::numeric, 89, false, true,
   'Pure Mulberry Silk', 'Zari Weave with Temple Border', 'Dry clean only', 'Saree with unstitched blouse fabric',
   '["Authentic Kanchipuram GI tagged product","Pure mulberry silk with real zari","Iconic temple border design","Comes with contrast blouse piece"]'::jsonb,
   2347),

  ('Banarasi Silk Saree', 'banarasi-silk-saree',
   'An exquisite Banarasi silk saree that is the crown jewel of any collection. Handwoven in the ancient city of Varanasi using the traditional kadwa weave technique, this masterpiece features intricate meenakari work with floral jaal patterns across the body. The deep maroon color symbolizes auspiciousness and celebration, making it an ideal choice for weddings, pujas, and grand festivities.',
   15999::numeric, '/product-kasavu-saree.png',
   '{"/collection-festive.png","/product-bridal-saree.png","/product-kasavu-saree.png","/collection-sarees.png"}'::text[],
   19999::numeric, 4.7::numeric, 156, false, true,
   'Pure Banarasi Silk', 'Kadwa Weave with Meenakari', 'Dry clean only', 'Saree with unstitched blouse fabric',
   '["Handwoven in Varanasi by master weavers","Authentic kadwa weave (not machine-cut)","Meenakari work with gold & silver zari","Heavy pallu with elaborate motifs"]'::jsonb,
   876),

  ('Cotton Handloom Saree', 'cotton-handloom-saree',
   'A beautifully crafted cotton handloom saree that celebrates the art of traditional Indian block printing. The rich indigo blue base is adorned with delicate white geometric and floral patterns, each stamped by hand using carved wooden blocks. Lightweight and breathable, this saree is your perfect companion for daily elegance, office wear, or casual outings.',
   1299::numeric, '/product-kasavu-saree.png',
   '{"/product-set-mundu.png","/product-kasavu-saree.png","/collection-new.png","/collection-sarees.png"}'::text[],
   1799::numeric, 4.5::numeric, 78, true, false,
   'Pure Handloom Cotton', 'Block Print', 'Gentle machine wash, cold water', 'Saree with unstitched blouse fabric',
   '["Hand block printed with natural dyes","Lightweight and breathable cotton","Perfect for daily and semi-formal wear","Eco-friendly production process"]'::jsonb,
   543),

  ('Mysore Silk Saree', 'mysore-silk-saree',
   'The Mysore Silk saree is renowned for its understated elegance and incredible softness. Made from pure Mysore crepe silk with a distinctive sheen, this emerald green beauty features a tasteful gold zari border. The smooth texture and beautiful drape make it a favorite among discerning women who appreciate subtle luxury. A GI-tagged product from the royal looms of Karnataka.',
   5999::numeric, '/product-kasavu-saree.png',
   '{"/collection-sarees.png","/product-bridal-saree.png","/product-kasavu-saree.png","/collection-festive.png"}'::text[],
   7999::numeric, 4.6::numeric, 112, false, false,
   'Pure Mysore Silk (Crepe)', 'Zari Border Weave', 'Dry clean recommended', 'Saree with unstitched blouse fabric',
   '["GI-tagged Mysore Silk","Pure crepe silk with natural sheen","Lightweight with excellent drape","Subtle zari border for understated elegance"]'::jsonb,
   728),

  ('Pochampally Ikat Saree', 'pochampally-ikat-saree',
   'A stunning Pochampally Ikat saree featuring the mesmerizing double-ikat technique from Telangana. Both the warp and weft threads are resist-dyed before weaving, creating the signature blurred-edge geometric patterns that are impossible to replicate by machine. The vibrant teal and coral palette brings a contemporary flair to this centuries-old art form.',
   4499::numeric, '/product-kasavu-saree.png',
   '{"/collection-new.png","/product-set-mundu.png","/product-kasavu-saree.png","/collection-sarees.png"}'::text[],
   5999::numeric, 4.4::numeric, 67, true, false,
   'Handloom Silk Cotton', 'Double Ikat Weave', 'Dry clean only', 'Saree with unstitched blouse fabric',
   '["Authentic Pochampally double ikat","UNESCO Intangible Heritage craft","Each piece is unique due to handmade process","Contemporary colors with traditional technique"]'::jsonb,
   392),

  ('Chanderi Silk Saree', 'chanderi-silk-saree',
   'A delicate Chanderi silk saree that is a symbol of Madhya Pradesh''s weaving heritage. Known for its sheer texture and lightweight feel, this pastel pink beauty is adorned with shimmering silver zari buttis scattered across the body. The gossamer-like fabric drapes beautifully and is perfect for summer celebrations, festivals, and elegant daytime events.',
   3999::numeric, '/product-kasavu-saree.png',
   '{"/product-kasavu-saree.png","/collection-festive.png","/product-bridal-saree.png","/collection-sarees.png"}'::text[],
   4999::numeric, 4.7::numeric, 93, false, true,
   'Chanderi Silk Cotton', 'Zari Buttis with Border', 'Gentle hand wash or dry clean', 'Saree with unstitched blouse fabric',
   '["Authentic Chanderi from Madhya Pradesh","Signature sheer texture and lightweight","Silver zari buttis with border","Perfect for summer and festive occasions"]'::jsonb,
   651),

  ('Paithani Silk Saree', 'paithani-silk-saree',
   'A breathtaking Paithani silk saree from Paithan, Maharashtra — often called the "Queen of Sarees." This wine purple masterpiece features the iconic peacock motif on the pallu, meticulously woven by hand using the tapestry weave technique. The muniya (parrot) border adds another layer of artistry. Each Paithani takes months to complete, making it a true heirloom piece worthy of passing down through generations.',
   18999::numeric, '/product-kasavu-saree.png',
   '{"/product-bridal-saree.png","/collection-festive.png","/product-kasavu-saree.png","/collection-sarees.png"}'::text[],
   24999::numeric, 4.9::numeric, 45, false, true,
   'Pure Paithani Silk', 'Peacock Pallu with Muniya Border', 'Dry clean only', 'Saree with unstitched blouse fabric',
   '["Handwoven in Paithan, Maharashtra","Iconic peacock pallu design","Tapestry weave technique – months to make","Heirloom quality investment piece"]'::jsonb,
   1203)
) AS v(name, slug, description, base_price, image, images, original_price, rating, reviews, is_new, is_bestseller, material, work, wash_care, items_included, highlights, recent_views)
WHERE c.slug = 'sarees'
ON CONFLICT (slug) DO NOTHING;

-- One variant per product (each dummy saree has a single 'Free Size' / single color / single sku)
INSERT INTO product_variants (product_id, color, size, sku, price, stock_quantity, variant_image_url)
SELECT p.id, v.color, 'Free Size', v.sku, p.base_price, 10, p.image
FROM products p, (VALUES
  ('kerala-kasavu-saree', 'Off White & Gold', 'MD-KKS-001-FS'),
  ('kanchipuram-silk-saree', 'Royal Magenta & Gold', 'MD-KSS-002-FS'),
  ('banarasi-silk-saree', 'Deep Maroon & Antique Gold', 'MD-BSS-003-FS'),
  ('cotton-handloom-saree', 'Indigo Blue & White', 'MD-CHS-004-FS'),
  ('mysore-silk-saree', 'Emerald Green & Gold', 'MD-MSS-005-FS'),
  ('pochampally-ikat-saree', 'Teal & Coral Multi', 'MD-PIS-006-FS'),
  ('chanderi-silk-saree', 'Pastel Pink & Silver', 'MD-CSS-007-FS'),
  ('paithani-silk-saree', 'Wine Purple & Gold', 'MD-PSS-008-FS')
) AS v(slug, color, sku)
WHERE p.slug = v.slug
ON CONFLICT (sku) DO NOTHING;

-- Close the RLS gap flagged as critical by the Supabase advisor: enable RLS
-- and allow public read-only access (no insert/update/delete for anon/authenticated).
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Public read" ON product_variants FOR SELECT USING (true);
