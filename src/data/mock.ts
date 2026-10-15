/**
 * Hizmet listeleri.
 *
 * Ürünler, kategoriler, yorumlar ve blog yazıları veritabanına taşındı.
 * Geriye yalnızca hizmet tanıtım listeleri kaldı; bunlar nadiren değişen
 * pazarlama metinleri olduğu için kodda duruyor.
 */
import type { Service } from '@/lib/types';
import type { IconName } from '@/components/ui/Icon';
import { SITE_CONFIG } from '@/lib/constants';

type ServiceWithIcon = Omit<Service, 'icon'> & { icon: IconName };


export const MOCK_SERVICES_TARIM: ServiceWithIcon[] = [
  {
    id: 1,
    title: 'Toprak Analizi',
    description: 'Laboratuvar ortamında kapsamlı toprak analizi yaparak ihtiyacınıza özel gübreleme planı hazırlıyoruz.',
    icon: 'analiz',
    features: ['NPK analizi', 'pH ölçümü', 'Mikro besin tespiti', 'Kişiselleştirilmiş rapor'],
    brand: 'alb-tarim',
    price: 'Ücretsiz danışmanlık',
  },
  // "Zirai Danışmanlık" ve "Tarımsal Danışmanlık" diye iki ayrı kart vardı;
  // ikisi de aynı şeyi anlatıyordu. Tek karta indirildi.
  //
  // Ayrıca eski "Zirai Danışmanlık" kartının maddeleri ("Arazi etüdü, Sistem
  // tasarımı, Montaj & test, 1 yıl bakım garantisi") sulama sistemi kurulumundan
  // kalmıştı — o hizmet kaldırıldığı için maddeler de başlıkla uyumlu hâle
  // getirildi.
  {
    id: 2,
    title: 'Zirai Danışmanlık',
    description: 'Toprak ve yaprak analizine dayalı gübreleme ve bitki koruma programı hazırlıyoruz.',
    icon: 'filiz',
    features: ['Arazi ziyareti', 'Besleme programı', 'Hastalık-zararlı takibi', 'Sezon boyu saha takibi'],
    brand: 'alb-tarim',
    price: 'Fiyat için arayın',
  },
];

export const MOCK_SERVICES_ALBSU: ServiceWithIcon[] = [
  {
    id: 10,
    title: 'Ücretsiz Montaj',
    description: 'Satın aldığınız su arıtma, sebil, boiler veya klima cihazını uzman ekibimiz montaj güvencesiyle kuruyor.',
    icon: 'servis',
    features: ['Ücretsiz montaj', 'Su / sistem testi', 'Kullanım eğitimi', '2 yıl garanti'],
    brand: 'alb-su-aritma',
    price: 'Ücretsiz',
  },
  {
    id: 11,
    title: 'Periyodik Bakım',
    description: 'Klima, boiler ve su arıtma cihazlarınız için yıllık bakım ve filtre değişim hizmeti.',
    icon: 'servis',
    features: ['Filtre / reçine değişimi', 'Gaz ve sistem kontrolü', 'Teknik rapor', 'Öncelikli servis'],
    brand: 'alb-su-aritma',
    price: 'Yıllık sözleşme',
  },
  {
    id: 12,
    title: 'Teknik Destek',
    description: 'Arıza durumunda telefonla uzaktan yardım, gerektiğinde yerinde teknisyen desteği.',
    icon: 'telefon',
    features: [`Destek hattı: ${SITE_CONFIG.workingHours}`, 'Uzaktan destek', 'Orijinal yedek parça', 'Garanti kapsamı'],
    brand: 'alb-su-aritma',
    price: 'Garanti dahilinde',
  },
];
