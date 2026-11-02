-- ═══════════════════════════════════════════════════════════════════════════
-- Happy Junior — Supabase ilk kurulum
--
-- Yeni (boş) bir Supabase projesinde SQL Editor'e yapıştırıp bir kez
-- çalıştırın. Sırasıyla: tablolar, indeksler, RLS kilidi, kategori ağacı.
--
-- Örnek ürünler ayrı dosyada: supabase/ornek-urunler.sql (isteğe bağlı,
-- yalnızca önizleme için; gerçek ürünler girilince panelden silinir).
--
-- Kaynak: prisma/schema.prisma. Şema değişirse bu dosya değil,
-- `npm run db:push` kullanılır; bu dosya yalnızca sıfırdan kurulum içindir.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Tablolar ───────────────────────────────────────────────────────────
CREATE TYPE "OrderStatus" AS ENUM ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED');
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING','APPROVED','REJECTED','COMPLETED');
CREATE TABLE "brands" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "logo_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "categories" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "brand_id" INTEGER NOT NULL,
  "parent_id" INTEGER,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "image_url" TEXT,
  "icon" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "products" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "category_id" INTEGER NOT NULL,
  "brand_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "short_description" TEXT,
  "sku" TEXT UNIQUE,
  "barcode" TEXT,
  "price" NUMERIC(14,2) NOT NULL,
  "sale_price" NUMERIC(14,2),
  "effective_price" NUMERIC(14,2),
  "stock_quantity" INTEGER NOT NULL DEFAULT 0,
  "min_stock_level" INTEGER NOT NULL DEFAULT 5,
  "unit" TEXT NOT NULL DEFAULT 'adet',
  "weight" NUMERIC(14,2),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_featured" BOOLEAN NOT NULL DEFAULT false,
  "meta_title" TEXT,
  "meta_description" TEXT,
  "product_brand" TEXT,
  "vat_rate" INTEGER NOT NULL DEFAULT 20,
  "rating" NUMERIC(14,2) NOT NULL DEFAULT 0,
  "review_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "product_images" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "product_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt_text" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE "product_variants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "product_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sku" TEXT UNIQUE,
  "stock_quantity" INTEGER NOT NULL DEFAULT 0,
  "price_override" NUMERIC(14,2),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("product_id","label")
);
CREATE TABLE "product_specifications" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "product_id" TEXT NOT NULL,
  "spec_name" TEXT NOT NULL,
  "spec_value" TEXT NOT NULL,
  "spec_unit" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "tags" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE
);
CREATE TABLE "product_tags" (
  "product_id" TEXT NOT NULL,
  "tag_id" INTEGER NOT NULL,
  PRIMARY KEY ("product_id","tag_id")
);
CREATE TABLE "users" (
  "id" UUID NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "phone" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "addresses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postal_code" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "orders" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "order_number" TEXT UNIQUE,
  "user_id" UUID NOT NULL,
  "address_id" TEXT,
  "brand_id" INTEGER NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal" NUMERIC(14,2),
  "shipping_fee" NUMERIC(14,2),
  "tax_amount" NUMERIC(14,2),
  "total_amount" NUMERIC(14,2) NOT NULL,
  "ship_full_name" TEXT,
  "ship_phone" TEXT,
  "ship_line1" TEXT,
  "ship_line2" TEXT,
  "ship_district" TEXT,
  "ship_city" TEXT,
  "ship_postal_code" TEXT,
  "carrier" TEXT,
  "tracking_number" TEXT,
  "shipped_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "stock_reduced" BOOLEAN NOT NULL DEFAULT false,
  "contract_accepted_at" TIMESTAMP(3),
  "contract_ip" TEXT,
  "contract_version" TEXT,
  "invoice_type" TEXT,
  "invoice_title" TEXT,
  "invoice_tax_id" TEXT,
  "invoice_tax_office" TEXT,
  "invoice_email" TEXT,
  "invoice_file_path" TEXT,
  "invoice_file_name" TEXT,
  "invoice_no" TEXT,
  "invoice_uploaded_at" TIMESTAMP(3),
  "notes" TEXT,
  "admin_note" TEXT,
  "payment_method" TEXT,
  "paid_at" TIMESTAMP(3),
  "delivery_method" TEXT NOT NULL DEFAULT 'kargo',
  "payment_token" TEXT,
  "payment_status" TEXT DEFAULT 'pending',
  "payment_id" TEXT,
  "form_content" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "favorites" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "product_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id","product_id")
);
CREATE TABLE "contact_messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brand_key" TEXT,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "order_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "variant_id" TEXT,
  "variant_label" TEXT,
  "quantity" INTEGER NOT NULL,
  "unit_price" NUMERIC(14,2) NOT NULL,
  "total_price" NUMERIC(14,2) NOT NULL,
  "vat_rate" INTEGER NOT NULL DEFAULT 20,
  "vat_amount" NUMERIC(14,2),
  "payment_transaction_id" TEXT
);
CREATE TABLE "return_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "items" JSONB,
  "admin_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3)
);
CREATE TABLE "blog_posts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brand_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "category" TEXT,
  "cover_image" TEXT,
  "author" TEXT,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "categories" ADD FOREIGN KEY ("brand_id") REFERENCES "brands" ("id");
ALTER TABLE "categories" ADD FOREIGN KEY ("parent_id") REFERENCES "categories" ("id");
ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");
ALTER TABLE "products" ADD FOREIGN KEY ("brand_id") REFERENCES "brands" ("id");
ALTER TABLE "product_images" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_specifications" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_tags" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "product_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE;
ALTER TABLE "addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
ALTER TABLE "orders" ADD FOREIGN KEY ("address_id") REFERENCES "addresses" ("id");
ALTER TABLE "orders" ADD FOREIGN KEY ("brand_id") REFERENCES "brands" ("id");
ALTER TABLE "favorites" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "favorites" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE;
ALTER TABLE "order_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");
ALTER TABLE "order_items" ADD FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL;
ALTER TABLE "return_requests" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
ALTER TABLE "blog_posts" ADD FOREIGN KEY ("brand_id") REFERENCES "brands" ("id");

-- ─── 2. İndeksler ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "products_brand_id_idx" ON "products" ("brand_id");
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");
CREATE INDEX IF NOT EXISTS "products_is_active_idx" ON "products" ("is_active");
CREATE INDEX IF NOT EXISTS "products_is_featured_idx" ON "products" ("is_featured");
CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images" ("product_id");
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants" ("product_id");
CREATE INDEX IF NOT EXISTS "product_specifications_product_id_idx" ON "product_specifications" ("product_id");
CREATE INDEX IF NOT EXISTS "addresses_user_id_idx" ON "addresses" ("user_id");
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");
CREATE INDEX IF NOT EXISTS "orders_brand_id_idx" ON "orders" ("brand_id");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");
CREATE INDEX IF NOT EXISTS "orders_payment_token_idx" ON "orders" ("payment_token");
CREATE INDEX IF NOT EXISTS "favorites_user_id_idx" ON "favorites" ("user_id");
CREATE INDEX IF NOT EXISTS "contact_messages_created_at_idx" ON "contact_messages" ("created_at");
CREATE INDEX IF NOT EXISTS "contact_messages_is_read_idx" ON "contact_messages" ("is_read");
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "order_items_variant_id_idx" ON "order_items" ("variant_id");
CREATE INDEX IF NOT EXISTS "return_requests_order_id_idx" ON "return_requests" ("order_id");
CREATE INDEX IF NOT EXISTS "return_requests_user_id_idx" ON "return_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "return_requests_status_idx" ON "return_requests" ("status");
CREATE INDEX IF NOT EXISTS "blog_posts_brand_id_is_published_published_at_idx" ON "blog_posts" ("brand_id", "is_published", "published_at");
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts" ("slug");

-- ─── 3. RLS kilidi ─────────────────────────────────────────────────────────
-- Uygulama veritabanına Prisma ile doğrudan (postgres rolüyle) bağlanır;
-- RLS bu bağlantıyı etkilemez. Ama Supabase her public tabloyu anon anahtarla
-- REST üzerinden de açar ve anon anahtar tarayıcıya gider. Politika
-- tanımlamadan RLS'i açmak, REST yolunu tamamen kapatır.
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_specifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "return_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- ─── 4. Mağaza ve kategori ağacı ───────────────────────────────────────────
INSERT INTO public.brands (id, key, name, description, logo_url, is_active, created_at) VALUES (1, 'happy-junior', 'Happy Junior', '0–15 yaş bebek ve çocuk giyimi, araç-gereç ve oyuncak', NULL, true, '2026-10-16 05:14:41.381');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (1, 1, NULL, 'Bebek (0–24 Ay)', 'bebek', NULL, NULL, NULL, 0, true, '2026-10-16 05:14:41.467');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (2, 1, 1, 'Kız Bebek', 'bebek-kiz', NULL, NULL, NULL, 0, true, '2026-10-16 05:14:41.478');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (3, 1, 1, 'Erkek Bebek', 'bebek-erkek', NULL, NULL, NULL, 1, true, '2026-10-16 05:14:41.482');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (4, 1, 1, 'Zıbın & Tulum', 'bebek-zibin-tulum', NULL, NULL, NULL, 2, true, '2026-10-16 05:14:41.489');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (5, 1, 1, 'Bebek Takımları', 'bebek-takim', NULL, NULL, NULL, 3, true, '2026-10-16 05:14:41.495');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (6, 1, NULL, 'Kız Çocuk', 'kiz-cocuk', NULL, NULL, NULL, 1, true, '2026-10-16 05:14:41.502');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (7, 1, 6, 'Takımlar', 'kiz-takim', NULL, NULL, NULL, 0, true, '2026-10-16 05:14:41.507');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (8, 1, 6, 'Üst Giyim', 'kiz-ust-giyim', NULL, NULL, NULL, 1, true, '2026-10-16 05:14:41.528');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (9, 1, 6, 'Alt Giyim', 'kiz-alt-giyim', NULL, NULL, NULL, 2, true, '2026-10-16 05:14:41.54');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (10, 1, 6, 'Elbise', 'kiz-elbise', NULL, NULL, NULL, 3, true, '2026-10-16 05:14:41.543');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (11, 1, 6, 'Dış Giyim', 'kiz-dis-giyim', NULL, NULL, NULL, 4, true, '2026-10-16 05:14:41.553');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (12, 1, NULL, 'Erkek Çocuk', 'erkek-cocuk', NULL, NULL, NULL, 2, true, '2026-10-16 05:14:41.561');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (13, 1, 12, 'Takımlar', 'erkek-takim', NULL, NULL, NULL, 0, true, '2026-10-16 05:14:41.569');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (14, 1, 12, 'Üst Giyim', 'erkek-ust-giyim', NULL, NULL, NULL, 1, true, '2026-10-16 05:14:41.572');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (15, 1, 12, 'Alt Giyim', 'erkek-alt-giyim', NULL, NULL, NULL, 2, true, '2026-10-16 05:14:41.582');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (16, 1, 12, 'Dış Giyim', 'erkek-dis-giyim', NULL, NULL, NULL, 3, true, '2026-10-16 05:14:41.591');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (17, 1, NULL, 'Ayakkabı', 'ayakkabi', NULL, NULL, NULL, 3, true, '2026-10-16 05:14:41.597');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (18, 1, 17, 'Sandalet', 'ayakkabi-sandalet', NULL, NULL, NULL, 0, true, '2026-10-16 05:14:41.604');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (19, 1, 17, 'Ayakkabı & Bot', 'ayakkabi-bot', NULL, NULL, NULL, 1, true, '2026-10-16 05:14:41.609');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (20, 1, NULL, 'Araç-Gereç & Aksesuar', 'arac-gerec', NULL, NULL, NULL, 4, true, '2026-10-16 05:14:41.617');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (21, 1, 20, 'Matara & Beslenme', 'arac-matara-beslenme', NULL, NULL, NULL, 0, true, '2026-10-16 05:14:41.62');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (22, 1, 20, 'Bebek Bakım', 'arac-bebek-bakim', NULL, NULL, NULL, 1, true, '2026-10-16 05:14:41.634');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (23, 1, 20, 'Aksesuar', 'arac-aksesuar', NULL, NULL, NULL, 2, true, '2026-10-16 05:14:41.644');
INSERT INTO public.categories (id, brand_id, parent_id, name, slug, description, image_url, icon, sort_order, is_active, created_at) VALUES (24, 1, NULL, 'Oyuncak', 'oyuncak', NULL, NULL, NULL, 5, true, '2026-10-16 05:14:41.649');
SELECT pg_catalog.setval('public.brands_id_seq', 33, true);
SELECT pg_catalog.setval('public.categories_id_seq', 33, true);

COMMIT;
