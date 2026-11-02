-- ═══════════════════════════════════════════════════════════════════════════
-- Happy Junior — ek güncelleme 01: indirim kuponları + etkin fiyat sütunu
--
-- kurulum.sql'i DAHA ÖNCE çalıştırdıysanız bunu SQL Editor'de bir kez
-- çalıştırın. Tekrar çalıştırmak zararsızdır. (Sıfırdan kurulumda gerekmez;
-- kurulum.sql bunları içeriyor.)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Etkin fiyat: COALESCE(indirimli fiyat, fiyat) ──────────────────────
-- Fiyata göre sıralama ve fiyat aralığı filtresi bu sütunu kullanıyor.
-- İlk kurulumda düz (boş) sütun olarak açılmıştı; veritabanının kendisinin
-- hesapladığı sütuna çevriliyor.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'effective_price' AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE products DROP COLUMN IF EXISTS effective_price;
    ALTER TABLE products ADD COLUMN effective_price NUMERIC(10,2)
      GENERATED ALWAYS AS (COALESCE(sale_price, price)) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS products_effective_price_idx ON products (effective_price);

-- ─── 2. Siparişte kupon bilgisi ────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code     VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);
CREATE INDEX IF NOT EXISTS orders_coupon_code_idx ON orders (coupon_code);

-- ─── 3. Kuponlar ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(40)  NOT NULL UNIQUE,
  percent          INTEGER      NOT NULL CHECK (percent BETWEEN 1 AND 90),
  description      VARCHAR(200),
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  only_new_members BOOLEAN      NOT NULL DEFAULT false,
  max_uses         INTEGER,
  per_user_limit   INTEGER      NOT NULL DEFAULT 1,
  min_amount       NUMERIC(10,2),
  starts_at        TIMESTAMP(3),
  ends_at          TIMESTAMP(3),
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Tarayıcıya giden anahtarla okunamasın (uygulama doğrudan bağlanıyor)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Yeni üyelere ilk siparişte %10. Kodu panelden değiştirebilir ya da
-- durdurabilirsiniz.
INSERT INTO coupons (code, percent, description, only_new_members, per_user_limit)
VALUES ('HOSGELDIN10', 10, 'Yeni üye hoş geldin indirimi', true, 1)
ON CONFLICT (code) DO NOTHING;

COMMIT;
