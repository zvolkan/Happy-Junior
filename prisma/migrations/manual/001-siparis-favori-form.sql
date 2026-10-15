-- ═══════════════════════════════════════════════════════════════════════════
-- Bayırlıoğlu — Şema güncellemesi
-- Supabase SQL Editor'de bir kez çalıştırın.
-- Tümü IF NOT EXISTS ile yazıldı; tekrar çalıştırmak zararsızdır.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. SİPARİŞ: tutar dökümü ──────────────────────────────────────────────
-- Kargo ücreti ayrı saklanmadığı için sipariş detayında yanlış ara toplam
-- gösteriliyordu. Artık her kalem ayrı tutuluyor.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal      NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee  NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount    NUMERIC(10,2);

-- ─── 2. SİPARİŞ: teslimat adresi anlık kopyası ─────────────────────────────
-- Müşteri adresini silince geçmiş siparişin teslimat bilgisi kayboluyordu.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_full_name   VARCHAR(150);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_phone       VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_line1       VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_line2       VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_district    VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_city        VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ship_postal_code VARCHAR(10);

-- ─── 3. SİPARİŞ: kargo takibi ──────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier         VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMP(3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMP(3);

-- ─── 4. SİPARİŞ: stok/ödeme yönetimi ───────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reduced BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id    VARCHAR(100);

-- Callback token'la sipariş arıyor; indeks olmadan tablo büyüdükçe yavaşlar
CREATE INDEX IF NOT EXISTS orders_payment_token_idx ON orders (payment_token);

-- Mevcut siparişler için tutar dökümünü doldur (kargo ücreti bilinmiyor,
-- toplam ara toplam kabul ediliyor)
UPDATE orders SET subtotal = total_amount WHERE subtotal IS NULL;
UPDATE orders SET shipping_fee = 0        WHERE shipping_fee IS NULL;

-- Ödemesi tamamlanmış eski siparişlerde stok zaten elle yönetildiği için
-- tekrar düşülmesin diye işaretle
UPDATE orders SET stock_reduced = TRUE WHERE payment_status = 'paid';

-- ─── 5. FAVORİLER ──────────────────────────────────────────────────────────
-- Favori butonu yalnızca ekranda çalışıyordu, hiçbir yere kaydedilmiyordu.

CREATE TABLE IF NOT EXISTS favorites (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT favorites_user_fkey
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT favorites_product_fkey
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_product_key
  ON favorites (user_id, product_id);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites (user_id);

-- ─── 6. İLETİŞİM MESAJLARI ─────────────────────────────────────────────────
-- İletişim formu verisi console.log'a gidiyordu; hiçbir mesaj kaydedilmiyordu.

CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  brand_key  VARCHAR(30),
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(30),
  subject    VARCHAR(150),
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at);
CREATE INDEX IF NOT EXISTS contact_messages_read_idx    ON contact_messages (is_read);

-- ═══════════════════════════════════════════════════════════════════════════
-- Kontrol
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'orders yeni sütunlar' AS kontrol, COUNT(*) AS adet
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('subtotal','shipping_fee','ship_full_name','tracking_number','stock_reduced');

SELECT 'yeni tablolar' AS kontrol, COUNT(*) AS adet
FROM information_schema.tables
WHERE table_name IN ('favorites','contact_messages');

-- ═══════════════════════════════════════════════════════════════════════════
-- EK: Mesafeli satış sözleşmesi onay kaydı (yasal ispat)
-- Bu bölümü de aynı şekilde bir kez çalıştırın.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMP(3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_ip          VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_version     VARCHAR(20);

SELECT 'sözleşme onay sütunları' AS kontrol, COUNT(*) AS adet
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('contract_accepted_at','contract_ip','contract_version');

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 2: Ürün bazlı KDV + fatura bilgileri
-- ═══════════════════════════════════════════════════════════════════════════

-- Ürün bazlı KDV oranı. Varsayılan %20; gübre/tohum gibi ürünleri admin
-- panelinden %1 veya %10 olarak işaretleyin.
ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_rate INTEGER NOT NULL DEFAULT 20;

-- Sipariş anındaki KDV — ürün oranı sonradan değişse de geçmiş fatura bozulmaz
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vat_rate   INTEGER NOT NULL DEFAULT 20;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(10,2);

-- Fatura bilgileri (e-arşiv için zorunlu)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_type       VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_title      VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_tax_id     VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_tax_office VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_email      VARCHAR(255);

SELECT 'KDV + fatura sütunları' AS kontrol, COUNT(*) AS adet
FROM information_schema.columns
WHERE (table_name = 'products'    AND column_name = 'vat_rate')
   OR (table_name = 'order_items' AND column_name IN ('vat_rate','vat_amount'))
   OR (table_name = 'orders'      AND column_name LIKE 'invoice_%');

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 3: Ürün listesi performans indeksleri
-- Filtreleme/sıralama artık veritabanında yapılıyor; bu indeksler olmadan
-- katalog büyüdükçe sorgular yavaşlar.
-- ═══════════════════════════════════════════════════════════════════════════

-- Marka + aktiflik + öne çıkan (varsayılan sıralama)
CREATE INDEX IF NOT EXISTS products_brand_active_featured_idx
  ON products (brand_id, is_active, is_featured DESC, created_at DESC);

-- Fiyata göre sıralama ve fiyat aralığı filtresi
CREATE INDEX IF NOT EXISTS products_brand_active_price_idx
  ON products (brand_id, is_active, price);

-- Kategori filtresi
CREATE INDEX IF NOT EXISTS products_category_active_idx
  ON products (category_id, is_active);

-- Ürün markası filtresi (TİMAC AGRO, HAIFA vb.)
CREATE INDEX IF NOT EXISTS products_product_brand_idx
  ON products (product_brand);

-- Stok filtresi
CREATE INDEX IF NOT EXISTS products_stock_idx
  ON products (stock_quantity);

-- Metin araması: büyük/küçük harf duyarsız LIKE için trigram indeksi.
-- pg_trgm uzantısı Supabase'de mevcuttur.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_short_desc_trgm_idx
  ON products USING gin (short_description gin_trgm_ops);

SELECT 'ürün indeksleri' AS kontrol, COUNT(*) AS adet
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname LIKE 'products_%_idx';

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 4: İade talebi (cayma hakkı)
-- Bu bölüm daha önce çalıştırılmadıysa güvenle çalıştırılabilir.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReturnStatus') THEN
    CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS return_requests (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  status      "ReturnStatus" NOT NULL DEFAULT 'PENDING',
  reason      TEXT NOT NULL,
  items       JSONB,
  admin_note  TEXT,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS return_requests_order_id_idx ON return_requests (order_id);
CREATE INDEX IF NOT EXISTS return_requests_user_id_idx  ON return_requests (user_id);
CREATE INDEX IF NOT EXISTS return_requests_status_idx   ON return_requests (status);

SELECT 'iade talepleri tablosu' AS kontrol,
       COUNT(*) AS var_mi
FROM information_schema.tables
WHERE table_name = 'return_requests';

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 5: Blog yazıları
-- Daha önce çalıştırılmadıysa güvenle çalıştırılabilir.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_posts (
  id           TEXT PRIMARY KEY,
  brand_id     INTEGER NOT NULL REFERENCES brands(id),
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(220) NOT NULL UNIQUE,
  excerpt      TEXT,
  content      TEXT NOT NULL,
  category     VARCHAR(80),
  cover_image  VARCHAR(500),
  author       VARCHAR(120),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP(3),
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS blog_posts_listing_idx
  ON blog_posts (brand_id, is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);

SELECT 'blog tablosu' AS kontrol, COUNT(*) AS var_mi
FROM information_schema.tables WHERE table_name = 'blog_posts';

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 6: iyzico kalem işlem kimliği
-- Korumalı Alışveriş teslimat onayı ve kalem bazlı iade için gerekli.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(60);

SELECT 'kalem işlem kimliği' AS kontrol, COUNT(*) AS var_mi
FROM information_schema.columns
WHERE table_name = 'order_items' AND column_name = 'payment_transaction_id';

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 7: Rakamdan oluşan sipariş numarası
--
-- Müşteriye gösterilen numara şimdiye kadar cuid'in son haneleriydi
-- ("...4FW4O5DO"). Artık her siparişin YYAAGG + 4 rastgele haneden oluşan
-- 10 haneli kendi numarası var (örn. 2608074831).
--
-- Aşağıdaki blok mevcut siparişleri de dolduruyor: numara siparişin KENDİ
-- oluşturulma tarihinden üretiliyor, yani eski siparişlerin numarası da
-- tarihine uyuyor. Çakışma olursa döngü yeniden deniyor.
-- Daha önce çalıştırıldıysa dolu satırlara dokunmuyor.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(20);

DO $$
DECLARE
  kayit   RECORD;
  aday    TEXT;
  deneme  INT;
BEGIN
  FOR kayit IN SELECT id, created_at FROM orders WHERE order_number IS NULL LOOP
    deneme := 0;
    LOOP
      aday := to_char(kayit.created_at, 'YYMMDD') ||
              lpad((floor(random() * 10000))::INT::TEXT, 4, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = aday);
      deneme := deneme + 1;
      IF deneme > 50 THEN
        -- Aşırı olasılıksız; yine de sonsuz döngüye girmeyelim
        aday := to_char(kayit.created_at, 'YYMMDD') ||
                lpad((floor(random() * 100000))::INT::TEXT, 5, '0');
        EXIT;
      END IF;
    END LOOP;
    UPDATE orders SET order_number = aday WHERE id = kayit.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key
  ON orders (order_number);

SELECT 'sipariş numarası' AS kontrol,
       COUNT(*) FILTER (WHERE order_number IS NOT NULL) AS numarali,
       COUNT(*) FILTER (WHERE order_number IS NULL)     AS numarasiz
FROM orders;

-- ═══════════════════════════════════════════════════════════════════════════
-- EK 8 (Happy Junior): Beden/yaş varyasyonu, havale onayı, teslimat yöntemi
-- `prisma db push` bunları zaten oluşturur; bu blok elle kurulum içindir.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_variants (
  id              TEXT PRIMARY KEY,
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label           VARCHAR(60) NOT NULL,
  sku             VARCHAR(100) UNIQUE,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  price_override  DECIMAL(10,2),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_variants_product_id_label_key UNIQUE (product_id, label)
);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants (product_id);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id    TEXT REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label VARCHAR(60);
CREATE INDEX IF NOT EXISTS order_items_variant_id_idx ON order_items (variant_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at         TIMESTAMP(3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) NOT NULL DEFAULT 'kargo';
