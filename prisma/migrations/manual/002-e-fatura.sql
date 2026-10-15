-- ============================================================================
-- 002 — E-FATURA PDF'İ
--
-- Supabase SQL Editor'de baştan sona çalıştırın. Tamamı IF NOT EXISTS ile
-- yazıldı; tekrar tekrar çalıştırmak güvenlidir.
--
-- İKİ PARÇASI VAR:
--   BÖLÜM 1 — orders tablosuna dört sütun (bu dosya yapar)
--   BÖLÜM 2 — "faturalar" adlı ÖZEL storage kovası (bu dosya yapar, ama
--             Supabase panelinden elle de yapılabilir)
-- ============================================================================


-- ── BÖLÜM 1: orders sütunları ───────────────────────────────────────────────
--
-- invoice_file_path : Storage içindeki dosya yolu. Herkese açık URL DEĞİL —
--                     fatura ad, adres ve TCKN/VKN taşıdığı için indirme her
--                     seferinde kimlik doğrulanıp imzalı bağlantıyla yapılıyor.
-- invoice_file_name : Müşteriye inen dosyanın adı (Fatura-260818xxxx.pdf).
-- invoice_no        : Faturanın kendi numarası; muhasebeyle eşleştirmek için.
-- invoice_uploaded_at: Ne zaman yüklendiği.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_file_path   VARCHAR(400);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_file_name   VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_no          VARCHAR(60);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_uploaded_at TIMESTAMP(3);


-- ── BÖLÜM 2: "faturalar" storage kovası ─────────────────────────────────────
--
-- ÖNEMLİ: public = false. Ürün görselleri herkese açık kovada duruyor ama
-- fatura olamaz; doğrudan URL ile erişilememeli.
--
-- Bu INSERT bazı Supabase projelerinde yetki nedeniyle hata verebilir. Hata
-- alırsanız kovayı panelden oluşturun:
--     Storage → New bucket → Name: faturalar → Public bucket: KAPALI → Create

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('faturalar', 'faturalar', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Kovaya erişim yalnızca service_role anahtarıyla, sunucu tarafından yapılıyor.
-- service_role zaten RLS'i atladığı için ek policy yazmaya gerek yok; policy
-- YOKLUĞU burada bilinçli bir güvenlik tercihidir: tarayıcıdaki anon anahtarla
-- hiç kimse fatura okuyamaz.


-- ── KONTROL ─────────────────────────────────────────────────────────────────

SELECT 'orders sütunları' AS kontrol,
       COUNT(*) FILTER (WHERE column_name = 'invoice_file_path')   AS yol,
       COUNT(*) FILTER (WHERE column_name = 'invoice_file_name')   AS dosya_adi,
       COUNT(*) FILTER (WHERE column_name = 'invoice_no')          AS fatura_no,
       COUNT(*) FILTER (WHERE column_name = 'invoice_uploaded_at') AS tarih
FROM information_schema.columns
WHERE table_name = 'orders';
-- Dördü de 1 dönmeli.

SELECT 'fatura kovası' AS kontrol,
       id,
       public AS herkese_acik  -- false OLMALI
FROM storage.buckets
WHERE id = 'faturalar';
-- Hiç satır dönmezse kovayı panelden elle oluşturun.
