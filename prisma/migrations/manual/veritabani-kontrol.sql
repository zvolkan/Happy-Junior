-- ═══════════════════════════════════════════════════════════════════════════
-- SADECE OKUR — hiçbir şey değiştirmez.
-- Supabase SQL Editor'de çalıştırın; üç migration'ın uygulanıp uygulanmadığını
-- söyler.
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '1) init'                       AS migration,
  CASE WHEN COUNT(*) = 7 THEN 'UYGULANMIŞ' ELSE 'EKSİK (' || COUNT(*) || '/7 tablo)' END AS durum
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('brands','categories','products','product_images',
                     'product_specifications','tags','product_tags')

UNION ALL

SELECT
  '2) add_user_order_models',
  CASE WHEN COUNT(*) = 4 THEN 'UYGULANMIŞ' ELSE 'EKSİK (' || COUNT(*) || '/4 tablo)' END
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users','addresses','orders','order_items')

UNION ALL

SELECT
  '3) add_payment_fields',
  CASE WHEN COUNT(*) = 2 THEN 'UYGULANMIŞ' ELSE 'EKSİK (' || COUNT(*) || '/2 sütun)' END
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('payment_status','payment_token')

UNION ALL

SELECT
  '4) manuel SQL (benim verdiğim)',
  CASE WHEN COUNT(*) = 5 THEN 'UYGULANMIŞ'
       ELSE 'EKSİK — 001-siparis-favori-form.sql çalıştırın (' || COUNT(*) || '/5)' END
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('favorites','contact_messages','product_variants',
                     'return_requests','blog_posts')

UNION ALL

SELECT
  '5) sipariş numarası (EK 7)',
  CASE WHEN COUNT(*) = 1 THEN 'UYGULANMIŞ' ELSE 'EKSİK — manuel SQL''i yeniden çalıştırın' END
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'order_number'

UNION ALL

SELECT
  '6) prisma db push ile gelenler',
  CASE WHEN COUNT(*) = 2 THEN 'VAR' ELSE 'EKSİK (' || COUNT(*) || '/2 sütun)' END
FROM information_schema.columns
WHERE table_name = 'products' AND column_name IN ('product_brand','vat_rate')

UNION ALL

-- ── 7) E-FATURA (002-e-fatura.sql) ─────────────────────────────────────────
-- Bu kontrol EKSİKTİ. `002` çalıştırılmamışsa fatura yükleme PDF'i Supabase'e
-- attıktan SONRA veritabanı hatası veriyor: depoda öksüz dosya kalıyor,
-- yönetici genel hata ekranı görüyor ve sebebini hiçbir yerden anlayamıyor.
SELECT
  '7) e-fatura sütunları (002)',
  CASE WHEN COUNT(*) = 4 THEN 'UYGULANMIŞ'
       ELSE 'EKSİK — 002-e-fatura.sql çalıştırın (' || COUNT(*) || '/4 sütun)' END
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('invoice_file_path','invoice_file_name',
                      'invoice_no','invoice_uploaded_at')

UNION ALL

-- ── 8) STORAGE KOVALARI ────────────────────────────────────────────────────
-- `faturalar` 002 tarafından oluşturuluyor. `product-images` ise HİÇBİR
-- belgede geçmiyordu: sıfırdan kurulumda ürün görseli yüklemek
-- "Bucket not found" ile başarısız oluyor ve sebebi hiçbir yerde yazmıyordu.
SELECT
  '8) storage kovaları',
  CASE WHEN COUNT(*) = 2 THEN 'VAR (faturalar + product-images)'
       ELSE 'EKSİK (' || COUNT(*) || '/2) — aşağıdaki nota bakın' END
FROM storage.buckets
WHERE id IN ('faturalar','product-images');


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. SATIR "EKSİK" DİYORSA
--
-- `faturalar`      → 002-e-fatura.sql dosyasını çalıştırın (kovayı o oluşturur)
-- `product-images` → HERKESE AÇIK olmalı. Supabase panelinden
--                    Storage > New bucket > adı: product-images, Public: açık
--                    ya da SQL ile:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('product-images', 'product-images', true)
--   ON CONFLICT (id) DO NOTHING;
--
--   -- Herkes okuyabilsin (ürün görselleri sitede görünüyor)
--   CREATE POLICY "product-images herkese açık okuma"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'product-images');
--
-- Yükleme service_role anahtarıyla yapıldığı için ayrıca INSERT politikası
-- gerekmiyor; service_role RLS'i baypas eder.
-- ═══════════════════════════════════════════════════════════════════════════
