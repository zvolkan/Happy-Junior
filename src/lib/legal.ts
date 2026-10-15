import { SITE_CONFIG } from './constants'
import { KARGO_LIMIT, KARGO_UCRETI, TESLIMAT_SURESI } from './checkout'

/**
 * Sözleşme metinleri — TEK KAYNAK.
 *
 * Metinler eskiden yalnızca ödeme ekranındaki bileşenin içinde, sabit dize
 * olarak duruyordu. Hem sitede okunabilecek bir sayfası yoktu (Mesafeli
 * Sözleşmeler Yönetmeliği bunu bekliyor) hem de kargo limiti gibi değerler
 * elle yazıldığı için kodla ayrışma riski taşıyordu.
 *
 * Artık kargo limiti, kargo ücreti ve teslimat süresi `checkout.ts`ten,
 * satıcı bilgileri `constants.ts`ten okunuyor. Birini değiştirdiğinizde
 * sözleşme metni de kendiliğinden güncelleniyor.
 *
 * ÖNEMLİ: Metinde değişiklik yaptığınızda `CONTRACT_VERSION`u artırın
 * (src/app/api/odeme/initialize/route.ts). Hangi müşterinin hangi sürümü
 * onayladığı siparişe yazılıyor ve uyuşmazlıkta ispat aracı bu.
 */

// ─── Satıcı künyesi ──────────────────────────────────────────────────────────
//
// Mesafeli Sözleşmeler Yönetmeliği m.5 satıcının açık kimlik bilgilerini
// zorunlu tutuyor. Buradaki değerler ticaret sicil kayıtlarındaki hâlleriyle
// yazılmıştır ve tek kaynaktır: sözleşme metinleri, ön bilgilendirme formu ve
// footer'daki yasal künye hepsi buradan besleniyor.
//
// `unvan` bilerek `COMPANY_NAME`den ayrıldı: o sabit sitede kullanılan kısa
// ticari isim ("Bayırlıoğlu"), yönetmelik ise ticaret sicilindeki TAM resmî
// unvanı istiyor. İkisi farklı şeyler; kısaltmayın.

export const SATICI = {
  unvan: 'BAYIRLIOĞLU TARIM İNŞAAT OTOMOTİV İTHALAT İHRACAT PAZARLAMA SANAYİ VE TİCARET LİMİTED ŞİRKETİ',
  mersis: '0153122147800001',
  vergiDairesi: 'ANAMUR VERGİ DAİRESİ',
  vergiNo: '1531221478',
  adres: SITE_CONFIG.address,
  telefon: SITE_CONFIG.phone,
  eposta: SITE_CONFIG.email,
  /** Cayma hakkı kapsamındaki iadelerin gönderileceği adres */
  iadeAdresi: SITE_CONFIG.address,
  /**
   * ETBİS kaydı tamamlandı (beyan: 2026).
   *
   * Footer eskiden KOŞULSUZ olarak "Bu site ETBİS'e kayıtlıdır." diyordu.
   * Kayıt yapılmadıysa bu yanlış beyandır ve idari yaptırıma açıktır; bu yüzden
   * cümle bu bayrağa bağlandı. Kayıt bir gün düşerse burayı `false` yapın,
   * cümle kendiliğinden kaybolur.
   */
  etbisKayitli: true,
} as const

/**
 * Künyede hangi alanlar hâlâ boş?
 *
 * Eskiden yalnızca "eksik" diye tek bir bayrak vardı ve log'da hangi alanın
 * eksik olduğu yazmıyordu; üçünden biri dolunca bile aynı mesaj çıkıyordu.
 */
const EKSIK_ALANLAR = (
  [
    ['MERSİS no', SATICI.mersis],
    ['vergi dairesi', SATICI.vergiDairesi],
    ['vergi no', SATICI.vergiNo],
  ] as const
)
  .filter(([, deger]) => deger.trim() === '')
  .map(([ad]) => ad)

/** Künye eksiksiz mi? Eksikse yayına çıkmadan tamamlanmalı. */
export const KUNYE_TAM = EKSIK_ALANLAR.length === 0

// Üretim derlemesinde eksik künyeyi sessizce geçmeyelim: log'a düşsün ki
// deploy sonrası fark edilsin. Bu bir UYARIDIR, hata değil — akışı durdurmaz.
if (process.env.NODE_ENV === 'production' && !KUNYE_TAM) {
  console.error(
    `[yasal] Satıcı künyesinde eksik alan: ${EKSIK_ALANLAR.join(', ')}. ` +
      'Mesafeli Sözleşmeler Yönetmeliği m.5 bu bilgileri zorunlu tutuyor; ' +
      'src/lib/legal.ts içindeki SATICI nesnesini doldurun.',
  )
}

const SITE_DOMAIN = SITE_CONFIG.url.replace(/^https?:\/\//, '').replace(/\/+$/, '')

/** Künyede boş bırakılan alanı metinde "—" olarak göster */
function alan(value: string): string {
  return value.trim() || '—'
}

const KUNYE = `Ticaret Unvanı: ${SATICI.unvan}
Adres: ${SATICI.adres}
Telefon: ${SATICI.telefon}
E-posta: ${SATICI.eposta}
İnternet Sitesi: ${SITE_DOMAIN}
MERSİS No: ${alan(SATICI.mersis)}
Vergi Dairesi / No: ${alan(SATICI.vergiDairesi)} / ${alan(SATICI.vergiNo)}
Ürün İade Adresi: ${SATICI.iadeAdresi}`

const KARGO_KURALI = `${KARGO_LIMIT.toLocaleString('tr-TR')} TL ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde ${KARGO_UCRETI.toLocaleString(
  'tr-TR',
  { minimumFractionDigits: 2 },
)} TL kargo ücreti alınır ve sipariş özetinde ayrıca gösterilir.`

// ─── 1. Ön Bilgilendirme Formu ───────────────────────────────────────────────

export const ON_BILGILENDIRME = `ÖN BİLGİLENDİRME FORMU

1. KONU
İşbu Ön Bilgilendirme Formu'nun konusu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 27 Kasım 2014 tarihli 29188 sayılı Resmî Gazete'de yayımlanan Mesafeli Sözleşmeler Yönetmeliği uyarınca, Alıcı'nın sipariş vermeden önce bilgilendirilmesidir.

2. TANIMLAR
ALICI: Mal veya hizmeti ticari ya da mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek kişiyi,
SATICI: Aşağıda künyesi verilen firmayı,
SİTE: ${SITE_DOMAIN} adresindeki internet sitesini,
ÜRÜN: Site üzerinden satışa sunulan ALB Tarım ve Alb Su Teknolojileri markalı malları
ifade eder.

3. SATICI BİLGİLERİ
${KUNYE}

4. ÜRÜNÜN TEMEL NİTELİKLERİ VE FİYAT
Ürünün türü, miktarı, markası/modeli ve diğer temel nitelikleri Site'deki ürün sayfasında yer alır. Site'de ilan edilen fiyatlar KDV dahil satış fiyatlarıdır ve güncelleninceye kadar geçerlidir. Süreli olarak ilan edilen kampanya fiyatları belirtilen sürenin sonuna kadar geçerlidir. Alıcı için bağlayıcı olan, siparişin verildiği andaki fiyattır.

5. ÖDEME
Ödeme, Site'de sunulan ödeme yöntemleriyle ve iyzico altyapısı üzerinden yapılır. Kart bilgileri Satıcı tarafından görülmez ve saklanmaz. Taksitli ödemelerde bankanızın uyguladığı vade farkı ödeme ekranında gösterilir.

6. TESLİMAT VE KARGO
Teslimat, sipariş onayından itibaren ortalama ${TESLIMAT_SURESI} içinde, her hâlükârda yasal azami süre olan 30 günü aşmamak kaydıyla, Alıcı'nın sipariş formunda belirttiği adrese yapılır.
${KARGO_KURALI}
Kurulum gerektiren su arıtma sistemlerinde teslimat ve montaj, Satıcı'nın yetkili servisi veya bayisi tarafından Alıcı ile önceden kararlaştırılan bir randevu gününde yerinde yapılır.

7. CAYMA HAKKI
Alıcı, malı teslim aldığı tarihten itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilir. Cayma bildiriminin nasıl yapılacağı, iade adresi ve cayma hakkının kullanılamayacağı hâller Mesafeli Satış Sözleşmesi'nin 7. ve 8. maddelerinde ayrıntılı olarak düzenlenmiştir.

8. ŞİKÂYET VE UYUŞMAZLIK
Alıcı, şikâyet ve itirazlarını ${SATICI.eposta} adresine veya ${SATICI.telefon} numarasına iletebilir. Uyuşmazlık hâlinde başvurulacak merciler Mesafeli Satış Sözleşmesi'nin 10. maddesinde belirtilmiştir.

9. KİŞİSEL VERİLER
Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenmektedir. Ayrıntılı bilgi Site'deki KVKK Aydınlatma Metni'nde yer alır.`

// ─── 2. Mesafeli Satış Sözleşmesi ────────────────────────────────────────────

export const MESAFELI_SATIS = `MESAFELİ SATIŞ SÖZLEŞMESİ

1. TARAFLAR

1.1. SATICI
${KUNYE}

1.2. ALICI
Sipariş sırasında beyan edilen ad-soyad, teslimat adresi, telefon ve e-posta bilgilerine sahip kişi. Bu bilgiler sipariş özetinde ve sipariş onay e-postasında yer alır ve işbu Sözleşme'nin ayrılmaz parçasıdır.

2. KONU
İşbu Sözleşme'nin konusu; Alıcı'nın Satıcı'ya ait ${SITE_DOMAIN} internet sitesinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.

3. ÜRÜN VE ÖDEME BİLGİLERİ
3.1. Ürünlerin tanımı, birim fiyatı, adedi, kargo bedeli ve ödenecek toplam tutar sipariş özetinde ve sipariş onay e-postasında yer alır. Alıcı bu bilgileri siparişi vermeden önce onaylamıştır.
3.2. Site'de ilan edilen fiyatlar KDV dahildir ve güncelleninceye kadar geçerlidir. Bağlayıcı olan, siparişin verildiği andaki fiyattır.
3.3. Ödeme, iyzico ödeme altyapısı üzerinden yapılır. Kart bilgileri Satıcı tarafından görülmez ve saklanmaz.

4. TESLİMAT
4.1. Ürün, sipariş onayından itibaren ortalama ${TESLIMAT_SURESI} içinde, her hâlükârda yasal azami süre olan 30 günü aşmamak kaydıyla, Alıcı'nın sipariş formunda belirttiği adrese teslim edilir. Teslim süresi Alıcı'nın bulunduğu yerin uzaklığına göre değişebilir.
4.2. Kargoyla gönderilen ürünlerde teslimat, Satıcı'nın anlaşmalı olduğu kargo firması aracılığıyla yapılır. Gönderiye ait kargo firması ve takip numarası, ürün kargoya verildiğinde Alıcı'ya e-posta ile bildirilir ve Site'deki "Sipariş Takibi" sayfasından izlenebilir.
4.3. ${KARGO_KURALI}
4.4. Kurulum gerektiren su arıtma sistemlerinde ürün, Satıcı'nın yetkili servisi veya bayisi tarafından Alıcı ile önceden kararlaştırılan bir randevu gününde yerinde teslim edilir ve montajı yapılır. Bu ürünlerde teslim tarihi, montajın tamamlandığı tarihtir.
4.5. Ürün, Alıcı'dan başka bir kişi veya kuruluşa teslim edilecekse, teslim alacak kişinin teslimatı kabul etmemesinden Satıcı sorumlu tutulamaz.
4.6. Alıcı, ürünü teslim aldığı anda kontrol etmekle ve hasarlı ya da ayıplı gördüğü ürünü kargo görevlisinden teslim almayarak kargo firmasına tutanak tutturmakla yükümlüdür. Tutanak tutulmadan teslim alınan ürünlerde taşıma kaynaklı hasar iddiasının ispatı güçleşir; bu durum Alıcı'nın Kanun'dan doğan ayıplı mal hükümlerine dayalı haklarını ortadan kaldırmaz.

5. GENEL HÜKÜMLER
5.1. Alıcı, Site'de sözleşme konusu ürünün temel nitelikleri, tüm vergiler dahil satış fiyatı, ödeme şekli, teslimat koşulları ve Satıcı'nın kimlik ve iletişim bilgilerine ilişkin ön bilgileri okuduğunu, bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini beyan eder.
5.2. Satıcı, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgesi ile kullanım kılavuzuyla birlikte teslim edilmesinden sorumludur.
5.3. Sipariş konusu ürünün tedarikinin imkânsızlaşması hâlinde Satıcı bu durumu ifa süresi dolmadan Alıcı'ya bildirir ve ödenen bedeli, bildirimden itibaren 14 (on dört) gün içinde Alıcı'nın ödeme yaptığı araca iade eder. Alıcı'nın kabul etmesi hâlinde Satıcı eşit kalite ve fiyatta farklı bir ürün tedarik edebilir.
5.4. Satıcı, mücbir sebepler ya da nakliyeyi engelleyen olağanüstü hava koşulları, ulaşımın kesilmesi gibi durumlar nedeniyle ürünü süresinde teslim edemezse durumu Alıcı'ya bildirir. Bu hâlde Alıcı siparişi iptal edebilir; iptal hâlinde ödenen bedel 14 (on dört) gün içinde iade edilir.
5.5. Kredi kartına yapılan iadelerde bedelin bankaya aktarılmasından sonra Alıcı'nın hesabına yansıma süresi tamamen bankanın işleyişine bağlıdır ve Satıcı'nın bu sürece müdahale imkânı yoktur.
5.6. Ürünün tesliminden sonra Alıcı'ya ait kredi kartının, Alıcı'nın kusuru olmaksızın yetkisiz kişilerce hukuka aykırı biçimde kullanıldığının tespiti ve ilgili banka veya finans kuruluşunun ürün bedelini Satıcı'ya ödememesi hâlinde Alıcı, kendisine teslim edilmiş ürünü 3 (üç) gün içinde Satıcı'ya iade eder; iade masrafı Satıcı'ya aittir.
5.7. Ürün fiyatının, ortalama bir kişinin bakışıyla açıkça hatalı olduğu anlaşılacak şekilde piyasa değerinin çok altında ilan edilmiş olması hâlinde Satıcı, bu fiyata verilen siparişleri iptal edip tahsil edilen bedeli iade etme hakkını saklı tutar.
5.8. Site'nin genel görünümü ve tasarımı ile Site'deki tüm metin, görsel, marka, logo ve yazılımların fikri ve sınai mülkiyet hakları Satıcı'ya veya lisans verenlerine aittir; izinsiz kopyalanamaz ve kullanılamaz.

6. FATURA
Sipariş faturası, Alıcı'nın sipariş sırasında beyan ettiği fatura bilgilerine göre düzenlenir ve e-posta ile iletilir. Kurumsal fatura talep edilmesi hâlinde ticaret unvanı, vergi dairesi ve vergi kimlik numarasının doğru beyan edilmesi Alıcı'nın sorumluluğundadır.

7. CAYMA HAKKI
7.1. Alıcı, malın kendisine veya gösterdiği adresteki kişiye teslim edildiği tarihten itibaren 14 (on dört) gün içinde, hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin sözleşmeden cayma hakkına sahiptir.
7.2. Cayma süresinin başlangıcında;
a) Tek sipariş konusu olup ayrı ayrı teslim edilen mallarda son malın teslim alındığı gün,
b) Birden fazla parçadan oluşan mallarda son parçanın teslim alındığı gün,
c) Belirli bir süre boyunca düzenli teslimin yapıldığı sözleşmelerde ilk malın teslim alındığı gün
esas alınır.
7.3. Alıcı cayma hakkını, 14 günlük süre içinde ${SATICI.eposta} adresine e-posta göndererek, ${SATICI.telefon} numarasını arayarak veya Site'de "Hesabım > Siparişlerim > Sipariş Detayı" adımlarını izleyip iade talebi oluşturarak kullanabilir.
7.4. Cayma bildiriminin ulaşmasından sonra Satıcı, ürünün Alıcı'dan alınması için Alıcı ile iletişime geçer. Satıcı bu yönde bir teklifte bulunmazsa Alıcı, ürünü cayma bildiriminden itibaren 10 (on) gün içinde Satıcı'nın işbu Sözleşme'nin 1.1. maddesinde belirtilen iade adresine gönderir.
7.5. İade edilecek ürünün, satılabilirliğine zarar gelmemiş olarak; kutusu, ambalajı, varsa standart aksesuarları ve faturasıyla birlikte gönderilmesi gerekir.
7.6. Cayma hakkı nedeniyle yapılan iadelerde kargo bedeli Satıcı'ya aittir. Alıcı, ürünü Satıcı'nın anlaşmalı olduğu kargo firmasıyla karşı ödemeli olarak gönderdiğinde herhangi bir kargo bedeli ödemez.
7.7. Satıcı, cayma bildiriminin kendisine ulaşmasından itibaren en geç 14 (on dört) gün içinde, kargo bedeli dahil olmak üzere Alıcı tarafından ödenen tüm bedeli, Alıcı'nın ödeme yaparken kullandığı araca uygun biçimde tek seferde iade eder.

8. CAYMA HAKKININ KULLANILAMAYACAĞI HÂLLER
Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca, taraflarca aksi kararlaştırılmadıkça aşağıdaki sözleşmelerde cayma hakkı kullanılamaz:
a) Alıcı'nın istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallara ilişkin sözleşmeler (özel karışım ve siparişe özel üretilen ürünler dahil).
b) Çabuk bozulabilen veya son kullanma tarihi geçebilecek malların teslimine ilişkin sözleşmeler.
c) Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan mallardan iadesi sağlık ve hijyen açısından uygun olmayanların teslimine ilişkin sözleşmeler (kullanılmış su filtresi ve membran gibi).
ç) Tesliminden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılması mümkün olmayan mallara ilişkin sözleşmeler.
d) Cayma hakkı süresi sona ermeden önce, Alıcı'nın onayıyla ifasına başlanan hizmetlere ilişkin sözleşmeler (Alıcı'nın talebiyle 14 günlük süre dolmadan yapılan montaj ve kurulum hizmetleri dahil).
Bu maddedeki istisnalar, ürünün ayıplı çıkması hâlinde Alıcı'nın Kanun'dan doğan seçimlik haklarını (onarım, değişim, bedel indirimi, sözleşmeden dönme) ortadan kaldırmaz.

9. TEMERRÜT
Alıcı'nın kredi kartıyla yaptığı ödemelerde temerrüde düşmesi hâlinde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde bankasına karşı sorumlu olacağını kabul eder. Bu durumda ilgili banka hukuki yollara başvurabilir; doğacak masraf ve avukatlık ücretini Alıcı'dan talep edebilir.

10. ŞİKÂYET VE UYUŞMAZLIKLARIN ÇÖZÜMÜ
10.1. Alıcı, ürün veya hizmete ilişkin her türlü öneri ve şikâyetini ${SATICI.eposta} adresine veya ${SATICI.telefon} numarasına iletebilir. Satıcı, kendisine ulaşan şikâyetleri yasal çerçevede inceleyerek çözüme kavuşturmayı taahhüt eder.
10.2. Alıcı, uyuşmazlık hâlinde şikâyet ve itirazlarını, Ticaret Bakanlığı tarafından her yıl aralık ayında ilan edilen parasal sınırlar dâhilinde, malı satın aldığı veya ikametgâhının bulunduğu yerdeki Tüketici Hakem Heyeti'ne ya da Tüketici Mahkemesi'ne yapabilir.

11. YÜRÜRLÜK
İşbu Sözleşme, Alıcı tarafından elektronik ortamda onaylanmakla kurulur ve yürürlüğe girer. Alıcı'nın onay tarihi, IP adresi ve onayladığı sözleşme sürümü Satıcı tarafından kayıt altına alınır. Sözleşme, sipariş konusu ürünün Alıcı'ya teslim edilmesiyle ifa edilmiş sayılır.
Alıcı, işbu Sözleşme'nin ve Ön Bilgilendirme Formu'nun tüm koşullarını okuduğunu, anladığını ve elektronik ortamda kabul ettiğini beyan eder.`

// ─── 3. Cayma Hakkı bilgilendirmesi ──────────────────────────────────────────

export const CAYMA_HAKKI = `CAYMA HAKKI

Cayma hakkı nedir?
6502 sayılı Tüketicinin Korunması Hakkında Kanun'un 48. maddesi ve Mesafeli Sözleşmeler Yönetmeliği'nin 9. maddesi uyarınca; internetten yaptığınız alışverişlerde, ürünü teslim aldığınız tarihten itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilirsiniz.

Nasıl kullanılır?
1. "Hesabım > Siparişlerim > Sipariş Detayı" adımlarını izleyin.
2. İade etmek istediğiniz ürünleri seçerek iade talebi oluşturun.
3. Talebiniz onaylandığında ürünü nasıl göndereceğiniz size bildirilir. Onay gelmeden ürünü göndermeyin.
4. Ürünü kutusu, ambalajı, varsa standart aksesuarları ve faturasıyla birlikte gönderin.

Dilerseniz aynı bildirimi ${SATICI.eposta} adresine e-posta göndererek veya ${SATICI.telefon} numarasını arayarak da yapabilirsiniz.

İade kargo bedeli
Cayma hakkı kapsamındaki iadelerde kargo bedeli Satıcı'ya aittir. Ürünü Satıcı'nın anlaşmalı olduğu kargo firmasıyla karşı ödemeli gönderdiğinizde herhangi bir ücret ödemezsiniz.

Paranız ne zaman iade edilir?
Cayma bildiriminizin ulaşmasından itibaren en geç 14 (on dört) gün içinde, kargo bedeli dahil ödediğiniz tüm tutar, ödeme yaparken kullandığınız araca iade edilir. Kredi kartı iadelerinin hesabınıza yansıması bankanıza bağlı olarak birkaç iş günü sürebilir.

Cayma hakkının kullanılamayacağı ürünler
Kişisel istek ve ihtiyaçlarınıza göre hazırlanan özel üretim ürünler, çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler, ambalajı açıldığında hijyen açısından iadesi uygun olmayan ürünler (kullanılmış filtre ve membran gibi), teslimden sonra başka ürünlerle karışıp ayrıştırılamayan ürünler ve 14 günlük süre dolmadan sizin onayınızla ifasına başlanan hizmetler (talebiniz üzerine yapılan montaj gibi) bu kapsamdadır.

Bu istisnalar, ürünün ayıplı çıkması durumundaki haklarınızı etkilemez. Ayıplı üründe onarım, değişim, bedel indirimi ve sözleşmeden dönme haklarınız saklıdır.

İletişim
${SATICI.eposta} · ${SATICI.telefon}
İade adresi: ${SATICI.iadeAdresi}`
