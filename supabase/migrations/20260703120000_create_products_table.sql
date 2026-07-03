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
