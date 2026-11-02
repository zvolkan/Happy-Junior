-- ═══════════════════════════════════════════════════════════════════════════
-- Happy Junior — ÖRNEK ürünler (yalnızca önizleme)
--
-- kurulum.sql'den sonra çalıştırın. Fotoğraflar public/images/ornek/ altında,
-- mağazanın Instagram paylaşımlarından kırpıldı. Gerçek ürünler girilince bu
-- ürünler panelden ya da şu satırla silinir:
--   DELETE FROM products WHERE slug IN ('tilki-desenli-kadife-gomlek-takimi',
--     'cicek-nakisli-kapitone-yelek-takimi','kadife-gomlek-bej','kapitone-yelek-adacayi');
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;
INSERT INTO public.products (id, category_id, brand_id, name, slug, description, short_description, sku, barcode, price, sale_price, effective_price, stock_quantity, min_stock_level, unit, weight, is_active, is_featured, meta_title, meta_description, product_brand, vat_rate, rating, review_count, created_at, updated_at) VALUES ('p1', 13, 1, 'Tilki Desenli Kadife Gömlek Takımı', 'tilki-desenli-kadife-gomlek-takimi', 'Bej kadife gömlek, "how do you feel?" nakışlı tilki desenli çizgili tişört ve kahverengi pantolondan oluşan üç parçalı takım.', 'Kadife gömlek, çizgili tişört ve pantolon — 3 parça', NULL, NULL, 1249.90, NULL, NULL, 12, 5, 'adet', NULL, true, true, NULL, NULL, NULL, 10, 0.00, 0, '2026-10-16 08:15:07.187', '2026-10-16 08:15:07.187');
INSERT INTO public.products (id, category_id, brand_id, name, slug, description, short_description, sku, barcode, price, sale_price, effective_price, stock_quantity, min_stock_level, unit, weight, is_active, is_featured, meta_title, meta_description, product_brand, vat_rate, rating, review_count, created_at, updated_at) VALUES ('p2', 7, 1, 'Çiçek Nakışlı Kapitone Yelek Takımı', 'cicek-nakisli-kapitone-yelek-takimi', 'Adaçayı yeşili kapitone yelek, çiçek desenli gömlek ve uyumlu taytdan oluşan takım.', 'Kapitone yelek, çiçekli gömlek ve tayt — 3 parça', NULL, NULL, 1349.90, 1099.90, NULL, 8, 5, 'adet', NULL, true, true, NULL, NULL, NULL, 10, 0.00, 0, '2026-10-16 08:15:07.187', '2026-10-16 08:15:07.187');
INSERT INTO public.products (id, category_id, brand_id, name, slug, description, short_description, sku, barcode, price, sale_price, effective_price, stock_quantity, min_stock_level, unit, weight, is_active, is_featured, meta_title, meta_description, product_brand, vat_rate, rating, review_count, created_at, updated_at) VALUES ('p3', 14, 1, 'Kadife Gömlek — Bej', 'kadife-gomlek-bej', 'Tek parça bej kadife gömlek.', 'Cepli, tilki aplikeli kadife gömlek', NULL, NULL, 649.90, NULL, NULL, 6, 5, 'adet', NULL, true, true, NULL, NULL, NULL, 10, 0.00, 0, '2026-10-16 08:15:07.187', '2026-10-16 08:15:07.187');
INSERT INTO public.products (id, category_id, brand_id, name, slug, description, short_description, sku, barcode, price, sale_price, effective_price, stock_quantity, min_stock_level, unit, weight, is_active, is_featured, meta_title, meta_description, product_brand, vat_rate, rating, review_count, created_at, updated_at) VALUES ('p4', 11, 1, 'Kapitone Yelek — Adaçayı', 'kapitone-yelek-adacayi', 'Tek parça kapitone yelek.', 'Çiçek nakışlı kapitone yelek', NULL, NULL, 599.90, 499.90, NULL, 0, 5, 'adet', NULL, true, true, NULL, NULL, NULL, 10, 0.00, 0, '2026-10-16 08:15:07.187', '2026-10-16 08:15:07.187');
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (1, 'p1', '/images/ornek/ig-1.jpg', 'Tilki desenli takım', 0, true);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (2, 'p1', '/images/ornek/ig-3.jpg', 'Takım çocuk üzerinde', 1, false);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (3, 'p1', '/images/ornek/ig-2.jpg', 'Detay', 2, false);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (4, 'p2', '/images/ornek/ig-4.jpg', 'Kapitone yelek takımı', 0, true);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (5, 'p2', '/images/ornek/ig-6.jpg', 'Takım çocuk üzerinde', 1, false);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (6, 'p2', '/images/ornek/ig-5.jpg', 'Detay', 2, false);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (7, 'p3', '/images/ornek/ig-3.jpg', 'Kadife gömlek', 0, true);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (8, 'p3', '/images/ornek/ig-2.jpg', 'Detay', 1, false);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (9, 'p4', '/images/ornek/ig-6.jpg', 'Kapitone yelek', 0, true);
INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES (10, 'p4', '/images/ornek/ig-5.jpg', 'Detay', 1, false);
INSERT INTO public.product_variants (id, product_id, label, sku, stock_quantity, price_override, sort_order, is_active, created_at, updated_at) VALUES ('v1', 'p1', '1 Yaş', NULL, 3, NULL, 0, true, '2026-10-16 08:15:07.23', '2026-10-16 08:15:07.23');
INSERT INTO public.product_variants (id, product_id, label, sku, stock_quantity, price_override, sort_order, is_active, created_at, updated_at) VALUES ('v2', 'p1', '2 Yaş', NULL, 5, NULL, 1, true, '2026-10-16 08:15:07.23', '2026-10-16 08:15:07.23');
INSERT INTO public.product_variants (id, product_id, label, sku, stock_quantity, price_override, sort_order, is_active, created_at, updated_at) VALUES ('v3', 'p1', '3 Yaş', NULL, 4, NULL, 2, true, '2026-10-16 08:15:07.23', '2026-10-16 08:15:07.23');
INSERT INTO public.product_variants (id, product_id, label, sku, stock_quantity, price_override, sort_order, is_active, created_at, updated_at) VALUES ('v4', 'p2', '1 Yaş', NULL, 2, NULL, 0, true, '2026-10-16 08:15:07.23', '2026-10-16 08:15:07.23');
INSERT INTO public.product_variants (id, product_id, label, sku, stock_quantity, price_override, sort_order, is_active, created_at, updated_at) VALUES ('v5', 'p2', '2 Yaş', NULL, 4, NULL, 1, true, '2026-10-16 08:15:07.23', '2026-10-16 08:15:07.23');
INSERT INTO public.product_variants (id, product_id, label, sku, stock_quantity, price_override, sort_order, is_active, created_at, updated_at) VALUES ('v6', 'p2', '3 Yaş', NULL, 2, NULL, 2, true, '2026-10-16 08:15:07.23', '2026-10-16 08:15:07.23');
SELECT pg_catalog.setval('public.product_images_id_seq', 33, true);
COMMIT;
