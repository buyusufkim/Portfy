// 90 Day Campaign 13-week templates

import { days31to37 } from './campaignDays31to37.js';
import { days38to45 } from './campaignDays38to45.js';
import { days46to52 } from './campaignDays46to52.js';
import { days53to60 } from './campaignDays53to60.js';
import { days61to67 } from './campaignDays61to67.js';
import { days68to75 } from './campaignDays68to75.js';
import { days76to83 } from './campaignDays76to83.js';
import { days84to90 } from './campaignDays84to90.js';

export interface CampaignTemplateTask {
  task_key: string;
  task_type: string;
  title: string;
  description: string;
  gpa_bucket: 'G' | 'P' | 'A' | 'Edu' | 'Review';
  difficulty?: 'required' | 'recommended' | 'bonus';
  xp_reward: number;
  estimated_minutes?: number;
}

export interface CampaignDayTemplate {
  day_number: number;
  week_number: number;
  phase_title: string;
  day_title: string;
  day_lesson_title: string;
  day_lesson_body: string;
  video_lesson_title: string;
  video_lesson_placeholder: string;
  main_objective: string;
  tasks: CampaignTemplateTask[];
}

export const DEFAULT_CAMPAIGN_TASKS: CampaignTemplateTask[] = [
  { task_key: 'def_g_1', task_type: 'prospecting', title: 'En az 15 yeni temas kur', description: 'Rehberinden veya sahadan 15 kişiyle iletişime geç.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
  { task_key: 'def_g_2', task_type: 'prospecting', title: '5 mülk sahibiyle iletişime geç', description: 'Potansiyel satıcı/kiralayıcı adayını ara veya mesaj at.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
  { task_key: 'def_g_3', task_type: 'followup', title: '10 takip araması/mesajı yap', description: 'Önceden görüştüğün kişilere kendisini hatırlat.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
  
  { task_key: 'def_p_1', task_type: 'portfolio', title: '1 potansiyel portföy adayı belirle', description: 'Bugünkü görüşmelerinden en sıcak portföy adayını CRM\'e ekle.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
  { task_key: 'def_p_2', task_type: 'portfolio', title: '1 değer analizi/CMA hazırlığı yap', description: 'Seçtiğin bölgedeki bir mülk için fiyat raporu çalış.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
  { task_key: 'def_p_3', task_type: 'prospecting', title: '1 yetki görüşmesi için randevu hedefle', description: 'Mal sahibiyle yüz yüze veya Zoom üzerinden sunum randevusu al.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 20 },

  { task_key: 'def_a_1', task_type: 'learning', title: '10 ilan analizi yap', description: 'Bölgendeki satılık/kiralık 10 ilanı incele.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
  { task_key: 'def_a_2', task_type: 'field', title: '3 sokak/site notu çıkar', description: 'Bölgedeki projeler hakkında bilgi topla.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
  { task_key: 'def_a_3', task_type: 'field', title: '1 saha/network noktası ekle', description: 'Esnaf veya site yöneticisiyle tanış.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },

  { task_key: 'def_rev', task_type: 'review', title: 'Gün sonu GPA kapanışını yap', description: 'Bugünün performansını CRM üzerine kaydet.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 } // mapped to A in DB, but Review conceptually
];

export const CAMPAIGN_90_DAYS: CampaignDayTemplate[] = [
  {
    day_number: 1,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'Niyet ve Kurulum',
    day_lesson_title: 'İlk Adım: Neden Buradasın?',
    day_lesson_body: 'Bugün satış yapma günü değil. Bugün bu mesleği neden yapacağını, hangi bölgede uzmanlaşacağını ve her gün neyi tekrar edeceğini belirleme günü.',
    video_lesson_title: 'Gayrimenkulde İlk 90 Gün Felsefesi',
    video_lesson_placeholder: 'İzlenecek ders: Mentor / ofis içi eğitim videosu (yakında)',
    main_objective: 'Temelleri sağlam atmak ve ilk sıcak listeyi oluşturmak.',
    tasks: [
      { task_key: 'd1_edu', task_type: 'learning', title: 'Niyet mektubu yaz ve imaj checklistini tamamla', description: 'Hedeflerini belirle, sosyal medya ve WhatsApp profilini profesyonelleştir.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd1_g1', task_type: 'prospecting', title: '20 kişilik ilk sıcak listeyi çıkar', description: 'Telefon rehberindeki en yakın 20 kişiyi seç.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd1_g2', task_type: 'content', title: '5 kişiye mesleğe başladığını bildir', description: 'Sıcak listenden 5 kişiyi arayıp yeni işini haber ver.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd1_g3', task_type: 'networking', title: '1 mentor / kıdemli danışmanla tanışma görüşmesi planla', description: 'Ofisten veya sektörden deneyimli biriyle kahve ayarla.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd1_p1', task_type: 'portfolio', title: 'İlk 3 potansiyel mülk sahibi adayını listele', description: 'Çevrende gayrimenkul satma/kiralama ihtimali olan 3 kişiyi bul.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd1_p2', task_type: 'learning', title: 'Değer analizi kavramını oku', description: 'CMA (Karşılaştırmalı Piyasa Analizi) nedir kendi cümlelerinle yaz.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd1_p3', task_type: 'learning', title: 'Değer analizi teklif cümleni yaz', description: '"Portföy var mı?" yerine kullanacağın değer analizi değer teklifini tasarla.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd1_a1', task_type: 'field', title: 'Uzmanlık bölgeni netleştir', description: 'Çalışacağın spesifik mahalle veya konut tipini belirle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd1_a2', task_type: 'learning', title: 'Bölgedeki 10 aktif ilanı incele', description: 'Uzmanlık bölgende en çok kim ilan girmiş ve fiyatlar ne durumda bak.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd1_a3', task_type: 'learning', title: 'Bölgenin 3 güçlü / 3 zayıf yönünü yaz', description: 'Ulaşım, sosyal yaşam, yapı stoğu açısından bölgeni analiz et.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd1_rev', task_type: 'review', title: 'Bugün öğrendiğin 3 şeyi yaz ve yarınki önceliği belirle', description: 'Gün sonu değerlendirmeni yap ve yarına zihnen hazırlan.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 2,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'Bölge Haritası',
    day_lesson_title: 'Bölgeni Sokak Sokak Öğren',
    day_lesson_body: 'Bilgi güçtür. Çevrendeki emlak stoğunu, fiyat çarpanlarını (m2 fiyatı, kat, cephe, bina yaşı vb.) öğrenmeden uzmanlık kurulamaz.',
    video_lesson_title: 'Mülk Değerleme Kriterleri',
    video_lesson_placeholder: 'İzlenecek ders: Mentor / ofis içi eğitim videosu (yakında)',
    main_objective: 'Dataları harmanlamak ve sahayı tanımak.',
    tasks: [
      { task_key: 'd2_edu', task_type: 'learning', title: 'Fiyat çarpanlarını öğren', description: 'm2 fiyatı, kat, cephe, bina yaşı, aidat, otopark kriterlerinin fiyata etkisini araştır.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd2_g1', task_type: 'prospecting', title: '10 yerel temas hedefi belirle', description: 'Bölgedeki siteler, muhtarlar veya esnaflardan temas listesi çıkar.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd2_g2', task_type: 'networking', title: '5 kişiye bölge hakkında soru sor', description: 'Bölgede yaşayan veya çalışan kişilerle sohbet başlat.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd2_g3', task_type: 'crm', title: '5 eski tanıdığı CRM\'e ekle', description: 'Aileni, eski iş arkadaşlarını sisteme düzenli kaydet.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd2_p1', task_type: 'portfolio', title: '5 sahibinden ilanı kaydet', description: 'Portalı tarayıp 5 adet potansiyel FSBO ilanı favorilerine veya notlarına al.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd2_p2', task_type: 'learning', title: '2 mülk için kabaca fiyat karşılaştırması yap', description: 'Bölgendeki satılık 2 evi özelliklerine göre karşılaştır.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd2_p3', task_type: 'portfolio', title: 'İlk CMA dosyası için örnek veri topla', description: 'Değer analizi taslağı oluşturmak için excel\'e veri gir.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd2_a1', task_type: 'learning', title: '20 ilan analizi yap', description: 'Piyasadaki arz durumunu görmek için seri ilan analizi yap.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd2_a2', task_type: 'field', title: '5 sokak/site notu çıkar', description: 'Hangi sitelerde hareketlilik var gözlemle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd2_a3', task_type: 'field', title: '1 saat saha turu yap', description: 'Sokağa çık ve uzmanlık bölgende yürü/araba ile dolaş.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd2_rev', task_type: 'review', title: 'Bugünkü bölge bulgularını yaz', description: 'Bugün saha ve ilanlardan ne öğrendin not et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 3,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'CRM ve Takip Disiplini',
    day_lesson_title: 'Takipsiz CRM Mezarlıktır',
    day_lesson_body: 'Datan ne kadar büyük olursa olsun, onları ne sıklıkla ve nasıl aradığın önemlidir. Takip edilmeyen kayıt ölüdür.',
    video_lesson_title: 'CRM Takip Sistematiği',
    video_lesson_placeholder: 'İzlenecek ders: CRM\'de takip tarihi neden kritiktir? (yakında)',
    main_objective: 'Sistemli arama alışkanlığı kazanmak.',
    tasks: [
      { task_key: 'd3_edu', task_type: 'learning', title: 'Takip felsefesini öğren', description: 'Takip planı neden önemlidir makalesini/notunu oku.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd3_g1', task_type: 'prospecting', title: '15 kişiyle iletişim kur', description: 'Sıcak ve ılık listeni ara veya mesaj at.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd3_g2', task_type: 'followup', title: '5 takip mesajı gönder', description: 'Önceki günlerde konuştuğun kişilere değer katan bir mesaj yolla.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd3_g3', task_type: 'networking', title: '3 yüz yüze/kahve görüşmesi planla', description: 'Referans ağını büyütmek için kahve sözü al.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 15 },
      { task_key: 'd3_p1', task_type: 'crm', title: '5 portföy adayı kaydı aç', description: 'Bugün veya daha önce keşfettiğin potansiyelleri CRM e gir.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd3_p2', task_type: 'learning', title: '1 değer analizi scripti hazırla', description: '"Size ücretsiz rapor gönderebilirim" diyaloğunu yaz.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd3_p3', task_type: 'learning', title: '1 mülk sahibi itirazını not et', description: 'Örn: "Kendim satarım", bu itirazı kaydet ve cevabını düşün.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd3_a1', task_type: 'learning', title: 'En iyi 10 rakip ilanı analiz et', description: 'Rakipler fotoğrafları nasıl çekmiş, ne yazmış incele.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd3_a2', task_type: 'learning', title: '3 rakip danışmanı incele', description: 'Bölgenin en iyilerinin profillerine bak.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd3_a3', task_type: 'learning', title: '5 bölge fiyat notu çıkar', description: 'Önemli 5 projenin giriş fiyatlarını ezberle.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd3_rev', task_type: 'review', title: 'Takipsiz CRM mezarlıktır notunu özetle', description: 'Bugün crm hakkında anladıklarını 2 cümleyle özetle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 4,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'FSBO Başlangıcı',
    day_lesson_title: 'Sahibinden Satıcılarla Konuşmak',
    day_lesson_body: 'FSBO (For Sale By Owner) yani sahibinden satılık ilanları, senin antrenman sahandır. "Satma" değil, "Randevu Al" mantığıyla yaklaş.',
    video_lesson_title: 'Mülk Sahiplerine Yaklaşım (FSBO)',
    video_lesson_placeholder: 'İzlenecek ders: FSBO yaklaşım scriptini çalış (yakında)',
    main_objective: 'İlk soğuk/soğuğa yakın aramaları atmak.',
    tasks: [
      { task_key: 'd4_edu', task_type: 'learning', title: 'FSBO scriptini çalış', description: 'İtiraz karşılama ve randevu alma scriptini sesli tekrar et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd4_g1', task_type: 'prospecting', title: '10 FSBO ilan sahibiyle temas kur', description: 'Portallardaki ilan sahiplerini ara, nezaketle tanış.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd4_g2', task_type: 'followup', title: '5 eski adayla tekrar konuş', description: 'Önceki gün temasta bulunduklarını ara.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd4_g3', task_type: 'crm', title: '10 CRM kaydı oluştur', description: 'Bugünkü tüm yeni bağları kaydet.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd4_p1', task_type: 'prospecting', title: '2 değer analizi teklifi yap', description: 'Soğuk aramalarda ücretsiz değer analizi öner.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd4_p2', task_type: 'networking', title: '1 yetki görüşmesi hedefle', description: 'Sıcak bakan biriyle yüzyüze/zoom randevusu kopar.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd4_p3', task_type: 'learning', title: '1 fiyat itirazı cevabı hazırla', description: '"Siz çok düşük söylüyorsunuz" itirazına yanıt hazırla.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd4_a1', task_type: 'learning', title: '10 sahibinden ilanı analiz et', description: 'FSBO ilanların fiyatlarını, fotosuzluk/yetersizlik durumlarını gör.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd4_a2', task_type: 'learning', title: '3 ilan hatası bul', description: 'Satıcıların yaptığı başlık/pazarlama hatalarını not et.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd4_a3', task_type: 'field', title: '1 mini bölge fiyat notu yaz', description: 'Bu ilanlardan yola çıkarak mahalleye ait fiyat düşünceni yaz.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd4_rev', task_type: 'review', title: 'En çok gelen itirazı yaz', description: 'Bugün telefonda duyduğun en sert itirazı kaydet ve gün sonu değerlendirmeni yap.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 5,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'İmaj ve Kişisel Marka',
    day_lesson_title: 'Vitrinini Temiz Tut',
    day_lesson_body: 'İnsanlar önce sana, sonra markaya, sonra hizmete güvenir. Sosyal medya, profil fotoğrafı ve iletişim dilin net olmalı.',
    video_lesson_title: 'Etkili Danışman Profili',
    video_lesson_placeholder: 'İzlenecek ders: WhatsApp Business / Profil / Bio checklist (yakında)',
    main_objective: 'Marka vitrinini düzenlemek ve görünürlüğü artırmak.',
    tasks: [
      { task_key: 'd5_edu', task_type: 'learning', title: 'Sosyal medya bio ve WP profilini denetle', description: 'Açıklamaların net mi, fotoğrafın aydınlık mı kontrol et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd5_g1', task_type: 'prospecting', title: '10 kişiye kişisel duyuru mesajı gönder', description: 'Yarı sıcak listeye profesyonel mesaj at.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd5_g2', task_type: 'networking', title: '5 DM/yorum etkileşimi yap', description: 'Bölgedeki yerel hesapların (kafe, spor salonu vs) gönderilerine anlamlı yorum at.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd5_g3', task_type: 'crm', title: '5 alıcı/kiracı adayı ekle', description: 'Aradığını duyuran insanları tespit et ve kaydet.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd5_p1', task_type: 'prospecting', title: '1 satıcıya değer analizi teklif mesajı gönder', description: 'Özel bir dille FSBO satıcısına yazılı teklif ilet.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd5_p2', task_type: 'learning', title: '1 portföy sunumu taslağı hazırla', description: 'Şirket/Kendi yetki sunum PDF/PowerPoint taslağını oluştur.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd5_p3', task_type: 'crm', title: '1 mülk sahibi takip tarihi ata', description: 'Görüştüğün birine, x gün sonrası için görev aç.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd5_a1', task_type: 'content', title: '1 bölge içeriği fikri çıkar', description: '"Bu bölgede yaşamanın 3 avantajı" gibi bir Reels/Post fikri yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd5_a2', task_type: 'learning', title: '10 ilan başlığı incele', description: 'Diğerleri nasıl dikkat çekmiş bak.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd5_a3', task_type: 'field', title: '5 site/sokak notu ekle', description: 'Saha bilginin detaylarını haritaya kaydet.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd5_rev', task_type: 'review', title: 'Bugünkü marka cümleni yaz', description: 'Bugün, sen kimsin ve ne vadediyorsun? Tek cümleyle özetle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 6,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'Saha Network Günü',
    day_lesson_title: 'Gizli Bilgi Sokaktadır',
    day_lesson_body: 'Kapıcılar, muhtarlar, esnaflar o bölgenin gerçek ayaklı portallarıdır. Onlarla iyi ilişkiler kuran portföyde asla aç kalmaz.',
    video_lesson_title: 'Saha Networkü Neden Kazandırır?',
    video_lesson_placeholder: 'İzlenecek ders: Bölge esnafıyla ve site yöneticisiyle iletişim gücü (yakında)',
    main_objective: 'Sokakta, binaların içinde bilgi akışı sağlayacak bağlar kurmak.',
    tasks: [
      { task_key: 'd6_edu', task_type: 'learning', title: 'Saha network stratejisini izle', description: 'Kimlerden nasıl bilgi alınır öğren.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd6_g1', task_type: 'field', title: '5 esnaf/site yöneticisi/apartman görevlisiyle tanış', description: 'Bölgende dolaş ve kendini nazikçe tanıt. Kartvizit bırak.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd6_g2', task_type: 'crm', title: 'Tüm yeni temasları (min 5) CRM\'e ekle', description: 'Adı, unvanı ve yeriyle sisteme kaydet.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd6_g3', task_type: 'networking', title: '3 referans isteği yap', description: 'Konuştuğun güvendiğin tanıdıklardan potansiyel isim iste.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 15 },
      { task_key: 'd6_p1', task_type: 'prospecting', title: '2 sıcak portföy adayı bul', description: 'Tanıştığın kişilerden o binada/sokakta satılık/kiralık düşünenleri tespit et.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd6_p2', task_type: 'networking', title: '1 değer analizi randevusu hedefle', description: 'Sıcak ipucuna ulaşır ulaşmaz randevu için aksiyon al.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd6_p3', task_type: 'crm', title: '1 mülk sahibi görüşme notu yaz', description: 'Elde ettiğin bir görüşmenin özetini sisteme gir.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd6_a1', task_type: 'field', title: '1 saat yoğun saha turu yap', description: 'Bölgeyi sokak sokak gezmeye devam et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd6_a2', task_type: 'field', title: '5 çevre/amenity notu çıkar', description: 'Market, okul, metro gibi bölge cazibe merkezlerini notla.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd6_a3', task_type: 'field', title: 'Bölge sınırlarını haritada güncelle', description: 'Bugün odağını hangi sokaklara verdin haritada (zihninde/sistemde) işaretle.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd6_rev', task_type: 'review', title: 'En değerli saha temasını kaydet', description: 'Bugün sokakta en iyi sohbeti kiminle yaptın? Gün sonu analiz et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 7,
    week_number: 1,
    phase_title: 'Sünger Modu',
    day_title: 'Haftalık Değerlendirme',
    day_lesson_title: 'Duruş ve Öz-Denetim',
    day_lesson_body: 'İlk hafta bir sünger gibi bilgi çektin. Şimdi ölçüm zamanı. Neyi iyi yaptın, neyi eksik bıraktın? Ölçülemeyen şey geliştirilemez.',
    video_lesson_title: 'Danışmanın Self-Audit Sistemi',
    video_lesson_placeholder: 'İzlenecek ders: Haftalık değerlendirme ve planlama (yakında)',
    main_objective: 'Data temizliği ve haftalık hedeflere hazırlık.',
    tasks: [
      { task_key: 'd7_edu', task_type: 'learning', title: 'Haftalık self-audit gerçekleştir', description: 'Tüm metriklerine bak.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd7_g1', task_type: 'followup', title: '10 takip araması/mesajı yap', description: 'Temasta olduğun kişilere iyi pazarlar/iyi hafta sonları dile.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd7_g2', task_type: 'networking', title: '5 sıcak çevre kişisine tekrar dokun', description: 'Yeni başladığını kutlayan kişilere teşekkür et.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd7_g3', task_type: 'learning', title: '1 mentor geri bildirimi iste', description: 'Ofisindeki kıdemlisine "Bu haftaki performansım nasıl sence?" de.', gpa_bucket: 'G', difficulty: 'bonus', xp_reward: 15 },
      { task_key: 'd7_p1', task_type: 'portfolio', title: 'Portföy adaylarını sıcak/ılık/soğuk ayır', description: 'CRM\'de liste düzenlemesi yap.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd7_p2', task_type: 'portfolio', title: '1 CMA örneği hazırla', description: 'Tam tekmil bir excel/pdf ekspertiz dosyası taslağını oturt.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd7_p3', task_type: 'learning', title: '1 yetki görüşmesi provası yap', description: 'Haftaya olası bir randevu için aynada sesli prova yap.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd7_a1', task_type: 'learning', title: 'Haftanın 20 ilan notunu özetle', description: 'Bölge fiyat trendinde ne gördün?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd7_a2', task_type: 'learning', title: 'Bölge güçlü/zayıf yönlerini güncelle', description: 'Hafta başındakine kıyasla ekleyeceklerin neler?', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd7_a3', task_type: 'content', title: '1 haftalık bölge raporu yaz', description: 'Kendin veya müşterin için taslak bir metin oluştur.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd7_rev', task_type: 'review', title: 'Haftanın sayısal analizini yapıp kapat', description: 'Kaç temas, kaç portföy adayı, kaç takip yaptığını yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  }
,

  {
    day_number: 8,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'İlk Temas ve Saha Cesareti',
    day_lesson_title: 'Sahibinden Satıcıya Yaklaşım',
    day_lesson_body: 'Sahibinden ilan sahibine portföy dilenmeden nasıl yaklaşılır? Kapıdan kovulmak işin bir parçasıdır. Amacımız satış değil, randevu almak ve ücretsiz değer analizi sunmaktır.',
    video_lesson_title: 'Mülk Sahibini Aramanın Psikolojisi',
    video_lesson_placeholder: 'İzlenecek ders: Sahibinden ilan görüşmesi (yakında)',
    main_objective: 'İlk FSBO teması ve itiraz karşılamaya başlamak.',
    tasks: [
      { task_key: 'd8_edu', task_type: 'learning', title: '1 FSBO scripti yaz', description: 'Kendin için etkili ve kısa bir sahibinden arama şablonu oluştur.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd8_g1', task_type: 'prospecting', title: '10 yeni CRM kaydı oluştur', description: 'Sahadan, portaldan ve çevrenden yeni kişileri sisteme gir.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd8_g2', task_type: 'followup', title: '5 sıcak çevre kişisine yeniden dokun', description: 'Geçen haftaki sıcak listenden 5 kişiye tekrar merhaba de.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd8_p1', task_type: 'prospecting', title: '5 ilan sahibine değer analizi teklifi hazırla', description: 'FSBO ilanlarından gözüne kestirdiğin 5 kişiye özel çalışma yap.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd8_p2', task_type: 'learning', title: '3 fiyat itirazı notu çıkar', description: 'Telefonda en sık gelecek fiyat itirazlarını çalış.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd8_a1', task_type: 'learning', title: '10 sahibinden ilanı analiz et', description: 'Bölgendeki güncel FSBO ilanlarına bak.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd8_a2', task_type: 'field', title: '1 mini bölge fiyat notu oluştur', description: 'Edindiğin izlenimle bölgenin fiyat durumu hakkında not çıkar.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd8_rev', task_type: 'review', title: 'En çok zorlandığın konuşmayı yaz', description: 'Telefondaki/yüz yüze en zorlayıcı temasından ne öğrendin?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 9,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'Satmaya Çalışma, İhtiyaç Keşfet',
    day_lesson_title: 'İhtiyaç Analizi Sanatı',
    day_lesson_body: 'İlk aramada satmaya çalışma, ihtiyaç keşfet. İnsanlar kendilerine bir şey satılmasından nefret eder ama dinlenilmeye bayılırlar. Cümlelerine "Tam olarak nasıl bir ev arıyorsunuz?" ile başla.',
    video_lesson_title: 'Alıcı ve Satıcı İhtiyaçlarını Anlamak',
    video_lesson_placeholder: 'İzlenecek ders: Etkin dinleme teknikleri (yakında)',
    main_objective: 'Müşteriyi doğru sorularla konuşturmak.',
    tasks: [
      { task_key: 'd9_edu', task_type: 'learning', title: 'İhtiyaç analizi scriptini çalış', description: '"Tam olarak nasıl bir ev arıyorsunuz?" pratiklerini yap.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd9_g1', task_type: 'prospecting', title: '15 yeni temas kur', description: 'Gün boyunca yeni 15 kişiye gayrimenkul sormak için ulaş.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd9_g2', task_type: 'prospecting', title: '5 alıcı/kiracı adayıyla ihtiyaç konuşması yap', description: 'Aktif ev arayan kişilerin detaylı beklentisini not al.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd9_p1', task_type: 'crm', title: '3 alıcı kartı oluştur', description: 'Konuştuğun adayların taleplerini CRM de detaylandır.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd9_p2', task_type: 'portfolio', title: '5 portföy adayı araştır', description: 'Bölgendeki potansiyel evleri tespit edip listele.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd9_a1', task_type: 'learning', title: '10 ilan fiyat/foto/açıklama analizi yap', description: 'Mevcut ilanlardaki "ihtiyaç yaratma" başlıklarını incele.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd9_rev', task_type: 'review', title: 'Öğrendiğin 3 müşteri ihtiyacı', description: 'Bugün sahada duyduğun en net üç talebi not alıp günü kapat.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd9_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 10,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'Karşılaştırmalı Piyasa Analizi (CMA)',
    day_lesson_title: 'CMA Kapı Açar',
    day_lesson_body: 'Bilgi en değerli para birimidir. Mal sahibine "Evinizi satalım" demek yerine, "Bölgenizdeki son fiyat raporunu hazırladım, incelemek ister misiniz?" demek size kapıları açar.',
    video_lesson_title: 'Etkili Karşılaştırmalı Fiyat Analizi',
    video_lesson_placeholder: 'İzlenecek ders: Fiyat belirleme stratejisi (yakında)',
    main_objective: 'Objektif veri kullanarak uzmanlık sergilemek.',
    tasks: [
      { task_key: 'd10_edu', task_type: 'learning', title: 'Değer analizi teklif cümleni yaz', description: 'Kendi cümlelerinle veri odaklı randevu alma teklifini kurgula.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd10_g1', task_type: 'followup', title: '10 takip araması/mesajı yap', description: 'Geçmiş günlerde konuştuğun adaylara kısa not at.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd10_p1', task_type: 'portfolio', title: '1 örnek CMA/değer analizi dosyası hazırla', description: 'Gerçek bir mülk üzerinden tam bir ekspertiz raporu çıkar.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd10_p2', task_type: 'prospecting', title: '5 mülk sahibine değer analizi teklif mesajı gönder', description: 'CMA gücünü kullanarak FSBOlara SMS veya WP yolla.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd10_a1', task_type: 'learning', title: '10 benzer ilan karşılaştır', description: 'CMA raporun için 10 rakip ilanı excel de işle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd10_a2', task_type: 'learning', title: '3 mülk için fiyat bandı çıkar', description: 'Örnek mülklerin satılabilirlik değer aralığını yaz.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd10_rev', task_type: 'review', title: 'Hangi veri satıcıyı ikna eder?', description: 'CMA hazırlarken satıcıyı en çok neyin etkileyeceğini bul ve günü kapat.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd10_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 11,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'CRM Takip Disiplini',
    day_lesson_title: 'Takip Tarihi Yoksa Kayıt Ölüdür',
    day_lesson_body: 'Datanızdaki bir satır sadece bir isme değil, potansiyel bir komisyona denktir. Her müşteri etkileşiminden sonraki adımı ve tarihi belirlemeden CRM den çıkmayın.',
    video_lesson_title: 'Etkili Dönüşüm İçin Takip',
    video_lesson_placeholder: 'İzlenecek ders: Müşteri sıcaklık sınıflaması (yakında)',
    main_objective: 'Dataları organize edip aksiyon tarihi atamak.',
    tasks: [
      { task_key: 'd11_edu', task_type: 'learning', title: '1 takip mesajı şablonu yaz', description: '"Sizinle şu tarihte görüşmüştük..." minvalinde bir taslak çıkar.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd11_g1', task_type: 'followup', title: '10 takip mesajı gönder', description: 'Hazırladığın şablonu kullanarak CRM üzerinden iletişim kur.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd11_p1', task_type: 'crm', title: '20 CRM kaydını kontrol et', description: 'Sistemindeki kişilerin bilgilerini eksik mi diye incele.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd11_p2', task_type: 'crm', title: 'Takip tarihi olmayanları tamamla', description: 'Geçmişe dönük temaslarının hepsine "gelecek temas" tarihi ata.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd11_p3', task_type: 'crm', title: '5 sıcak adayı A/B/C veya sıcak/ılık/soğuk ayır', description: 'Adayların önceliğini CRM üzerinde derecelendir.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd11_a1', task_type: 'learning', title: '3 mülk sahibi itirazı kaydet', description: '"Acelesi yok", "komisyon çok" gibi duyduğun itirazları dosyala.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd11_rev', task_type: 'review', title: 'Takipsiz kalan en değerli aday?', description: 'Günün sonunda, şimdiye kadar unuttuğunu fark ettiğin en değerli adayı yaz ve planını netleştir.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd11_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 12,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'Saha Networkü Para Kazandırır',
    day_lesson_title: 'Sokağın Gözü Kulağı Ol',
    day_lesson_body: 'Kapıcılar, muhtarlar ve yerel esnaf... Onlar sizin sahadaki gayriresmi ortaklarınız. Oradaki itibarınız, portala ilan düşmeden yetki almanızı sağlar.',
    video_lesson_title: 'Yerel Bağlantı Kurma',
    video_lesson_placeholder: 'İzlenecek ders: Esnaf ile uzun vadeli ilişki (yakında)',
    main_objective: 'Mahalle esnafı ve site yöneticileri ile tanışmak.',
    tasks: [
      { task_key: 'd12_edu', task_type: 'learning', title: 'Saha tanışma scripti yaz', description: 'Bir dükkana/siteye girdiğinde kendini 10 saniyede nasıl tanıtırsın?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd12_g1', task_type: 'field', title: '5 esnaf/site yöneticisi/apartman görevlisiyle tanış', description: 'Kartını bırak ve kısa bir ayaküstü sohbet et.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd12_g2', task_type: 'networking', title: '3 referans talebi yap', description: '"Bildiğiniz satacak/kiralayacak ufacık bir yer var mı?" diye sor.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd12_p1', task_type: 'crm', title: '5 saha network kaydı oluştur', description: 'Tanıştığın bu 5 kişiyi hemen CRM e kaydet.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd12_a1', task_type: 'field', title: '10 yerel bilgi topla', description: 'Son bir ayda ne satılmış, site aidatları ne olmuş öğren.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd12_a2', task_type: 'field', title: '3 bölge noktası notu çıkar', description: 'En hareketli köşe, en sessiz sokak gibi saptamalar yap.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd12_rev', task_type: 'review', title: 'En değerli network kişisi', description: 'Bugün tanıştığın, gelecekte işine en çok yarayabilecek 1 kişiyi not al.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd12_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 13,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'Alıcı Havuzu İnşası',
    day_lesson_title: 'Alıcın Yoksa Satıcın da Yoktur',
    day_lesson_body: 'Alıcı havuzu olmadan portföy gücün zayıftır. Satıcılar, "müşterim var" diyen danışmana güvenirler. Her aramayı titizlikle kaydet.',
    video_lesson_title: 'Nitelikli Alıcı Mülakatı',
    video_lesson_placeholder: 'İzlenecek ders: Alıcı eleme soruları (yakında)',
    main_objective: 'Alıcıları segmente etmek ve gerçek motivasyonlarını bulmak.',
    tasks: [
      { task_key: 'd13_edu', task_type: 'learning', title: '"Karar vermek için ne eksik?" sorusunu çalış', description: 'Tereddütlü alıcıları açacak kritik soruları ezberle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd13_g1', task_type: 'followup', title: '10 takip mesajı gönder', description: 'Datalarından alıcılara özel, "Şu an durumunuz nedir?" minvalinde mesaj at.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd13_p1', task_type: 'crm', title: '5 yeni alıcı/kiracı kaydı oluştur', description: 'Portfoy ilanları çaldıranları, afişi arayanları özel havuza taşı.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd13_p2', task_type: 'crm', title: '3 alıcı kartını detaylandır', description: 'Bütçe, arayış süresi ve kredi durumlarını tamamla.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd13_p3', task_type: 'portfolio', title: 'Her alıcı için bütçe/bölge/oda/aciliyet yaz', description: 'Eksik verilerini doldur, önceliği ayarla.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd13_a1', task_type: 'portfolio', title: '5 uygun ilan eşleştir', description: 'Sıcak 3 alıcın için kendi portföylerin veya FSBO lardan 5 mülk önerisi bul.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd13_rev', task_type: 'review', title: 'En sıcak alıcı kim?', description: 'Şu an elindeki komisyona en yakın alıcıyı yaz ve sabahki stratejini belirle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd13_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 14,
    week_number: 2,
    phase_title: 'Sokağa İnme',
    day_title: 'İki Haftalık Kapanış',
    day_lesson_title: 'Self-Audit',
    day_lesson_body: 'Duygularla değil sayılarla hareket et. İki haftan geçti; kaç insanla konuştun, kaç kayıt açtın? Sayıların düşükse aksiyonunu büyütmelisin.',
    video_lesson_title: 'Rakamlarla Yüzleşmek',
    video_lesson_placeholder: 'İzlenecek ders: Aylık kota ve performans izleme (yakında)',
    main_objective: 'Kendini denetlemek ve 3. hafta stratejisini yazmak.',
    tasks: [
      { task_key: 'd14_edu', task_type: 'learning', title: '3. hafta hedefini yaz', description: 'Gelecek haftaki arama, sunum ve toplantı hedefini koy.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd14_g1', task_type: 'learning', title: 'Mentor/kıdemli danışmandan 1 geri bildirim iste', description: 'İki haftalık sayılarını gösterip "Nerede eksiğim var?" diye sor.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd14_a1', task_type: 'learning', title: 'Toplam temas sayını yaz', description: '14 günde toplam kaç kişiyle konuştun hesapla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd14_a2', task_type: 'crm', title: 'Toplam CRM kayıt sayını yaz', description: 'Veritabanındaki kişi sayısını raporla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd14_a3', task_type: 'portfolio', title: 'Portföy adayı sayını yaz', description: 'İhtimali olan kaç mal sahibin var?', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd14_a4', task_type: 'learning', title: 'En çok gelen 3 itirazı yaz', description: 'Satıcı/alıcılardan duyduğun engelleri listele.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 5 },
      { task_key: 'd14_a5', task_type: 'field', title: 'En güçlü bölge bulgunu yaz', description: 'İki haftada mahallenden ne öğrendin özetle.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 5 },
      { task_key: 'd14_rev', task_type: 'review', title: 'Bırakmamak için nedenin?', description: 'Sürecin zorluklarına karşı "neden başladığını" kendine hatırlat.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  }
,

  {
    day_number: 15,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: 'İlk İçerik ve Çevre Lansmanı',
    day_lesson_title: 'Görünmezsen Kaybolursun',
    day_lesson_body: 'Kimse gizli bir ajana evini emanet etmez. Sosyal medyada "ben bu işte uzmanlaşıyorum" mesajı, soğuk aramadan bin kat daha etkili sıcak liste dönüşümü yaratır.',
    video_lesson_title: 'Kişisel Marka Lansmanı',
    video_lesson_placeholder: 'İzlenecek ders: Sosyal medyada itibar yönetimi (yakında)',
    main_objective: 'Kişisel duyuru kampanyanını tamamlayıp etkileşim almak.',
    tasks: [
      { task_key: 'd15_edu', task_type: 'content', title: 'Sıcak çevre lansmanı / kişisel duyuru mesajı hazırla', description: 'Geniş çevren için profesyonel bir "Ben artık gayrimenkul işindeyim" yazısı kurgula.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd15_g1', task_type: 'prospecting', title: '20 telefon/mesaj teması yap', description: 'Günün tüm enerji bloğunu çevrene haber vermeye (veya FSBO arayama) ayır.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd15_g2', task_type: 'networking', title: '1 özel kahve görüşmesi iste', description: 'En çok potansiyeli veya çevresi olan birine yarın/öbür gün için buluşma teklif et.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd15_p1', task_type: 'portfolio', title: '2 değer analizi teklifi yap', description: 'Görüştüğün kişilere veya ilan sahiplerine ücretsiz analiz sunduğunu söyle.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd15_p2', task_type: 'crm', title: '5 alıcı/kiracı kaydı ekle', description: 'Mesajlara dönenlerden veya aramalardan gelen talepleri topla.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd15_a1', task_type: 'content', title: '"Benim Bölgem" içerik serisine başla', description: 'Uzmanlık bölgeni anlatan şık bir fotoğraf veya grafik hazırla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd15_a2', task_type: 'content', title: '1 bölge storysi at', description: 'Sahada veya masada aktif olduğunu gösteren bir anlık paylaşım yap.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd15_rev', task_type: 'review', title: 'Bugünün ölçümü', description: 'Atılan mesaj adedi, dönen kişi adedi ve oluşan fırsatları not et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 16,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: 'Bilgi Paylaşımı ve Fayda Odaklılık',
    day_lesson_title: 'Önce Değer Yarat, Sonra Talep Et',
    day_lesson_body: 'Müşteriler sadece onların sorununu çözen kişilere para öder. Bugün çevrene ve dijital ağlarına faydalı bir bilgi vererek uzmanlığını kanıtlayacaksın.',
    video_lesson_title: 'İçerik Pazarlaması (Content Marketing)',
    video_lesson_placeholder: 'İzlenecek ders: Alıcı/Satıcı rehberleri oluşturmak (yakında)',
    main_objective: 'Sosyal varlığını faydalı bir içerikle güçlendirmek.',
    tasks: [
      { task_key: 'd16_edu', task_type: 'learning', title: 'Roleplay/İtiraz çalışması metnini oku', description: '"Şu an ev satışları durdu" itirazına nasıl cevap vereceğini tasarla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd16_g1', task_type: 'prospecting', title: '20 telefon/mesaj teması yap', description: 'Listendeki FSBO ları veya CRM takibi gelenleri ara.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd16_g2', task_type: 'networking', title: '1 yüz yüze/kahve görüşmesi yap', description: 'Fiziksel randevuna git veya yenisini organize et.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd16_p1', task_type: 'portfolio', title: '2 değer analizi teklifi yap', description: 'Soğuk aramalarda randevu almak için CMA şansını kullan.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd16_p2', task_type: 'crm', title: 'Potansiyel sunum için hazırlık yap', description: "Aldığın/Alacağın randevu için dosyanı hazır tut.", gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd16_a1', task_type: 'content', title: '1 faydalı içerik / rehber yayımla', description: '"Evini Satarken Yapılan 3 Hata" gibi ufak bir post çık.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd16_a2', task_type: 'content', title: '1 bölge storysi at', description: 'Mahalleden / projeden bir fotoğraf paylaş.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 5 },
      { task_key: 'd16_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Kaç kişi paylaştığın içeriğe baktı? Beğenenlerden ipucu var mı?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 17,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: 'Sahada Yüz Yüze',
    day_lesson_title: 'Kahve Görüşmeleri',
    day_lesson_body: 'Telefon güven inşa eder ama yüz yüze görüşme yetki sözleşmesini imzalatır. Eski müşterilerinle, esnafla veya referans veren kişilerle 15 dakikalık ufak sohbetler komisyona giden en kısa yoldur.',
    video_lesson_title: 'Masa Değil Saha Kazanır',
    video_lesson_placeholder: 'İzlenecek ders: Kahve görüşmesinde işi gayrimenkule bağlama (yakında)',
    main_objective: 'Fiziksel temasları artırmak.',
    tasks: [
      { task_key: 'd17_edu', task_type: 'learning', title: '1 yetki görüşmesi provası yap', description: 'Randevunda yetki evrağını nasıl çıkaracağını ayna karşısında çalış.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd17_g1', task_type: 'networking', title: '2 yüz yüze/kahve görüşmesi yap', description: 'Gün içinde önceden anlaştığın veya spontane 2 kişiyle otur.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd17_g2', task_type: 'followup', title: '10 telefon/mesaj teması yap', description: 'Datalarına "iyi haftalar, selamlar" tarzında yumuşak temaslar at.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd17_p1', task_type: 'crm', title: 'Görüşmelerden çıkan 5 adayı kaydet', description: '"Benim teyzem de ev bakıyor" cümlelerinin peşine düş.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd17_p2', task_type: 'portfolio', title: '1 değer analizi teklifi yap', description: 'Masadaki sohbet esnasında ücretsiz rapor gücünü kullan.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd17_a1', task_type: 'content', title: 'Benim Bölgem: Sokak röportajı / Esnaf ziyareti', description: 'Bölgedeki bir işletmeyi öven veya anlatan ufak bir paylaşım yap.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd17_a2', task_type: 'field', title: '1 bölge storysi at', description: 'Kahve içtiğin mekandan bir poz paylaş ("işler güçler" konsepti).', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd17_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Kahve görüşmeleri işe yaradı mı? CRM e yeni biri eklendi mi?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 18,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: 'İtirazlarla Yüzleşme',
    day_lesson_title: 'İtirazlar Satın Alma Belirtisidir',
    day_lesson_body: 'Dirençle karşılaşmak iyidir. "Komisyon ödemem" veya "Kendi fiyatım var" diyen kişi aslında satmak istiyordur. Sorunları bir kalkan değil, çözülmesi gereken bir bulmaca gibi gör.',
    video_lesson_title: 'Yaygın İtirazların Klasik Yanıtları',
    video_lesson_placeholder: 'İzlenecek ders: İtiraz karşılama ve roleplay (yakında)',
    main_objective: 'Telefon görüşmesindeki engelleri aşma yeteneği geliştirmek.',
    tasks: [
      { task_key: 'd18_edu', task_type: 'learning', title: 'Roleplay/itiraz çalışması (ses kaydı)', description: 'Kendi sesini kaydederek itirazlara verdiğin yanıtı dinle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd18_g1', task_type: 'prospecting', title: '20 telefon/mesaj teması yap', description: 'Bugünün odağını FSBO üzerine yoğunlaştır.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd18_p1', task_type: 'portfolio', title: '2 değer analizi teklifi yap', description: 'Telefonun sonunu muhakkak bir CMA teklifiyle bağla.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd18_p2', task_type: 'crm', title: 'Sahibinden sahiplerini CRM e kaydet', description: 'Numarasını aldığın FSBO\'ları durumlarıyla işle.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd18_p3', task_type: 'crm', title: '5 alıcı/kiracı kaydı güncelle', description: 'Havuzundaki kişilerin durumlarını teyit et.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd18_a1', task_type: 'content', title: '1 faydalı içerik: "Neden Uzmanla Çalışmalı?"', description: '"Sahibinden ev satmanın gizli maliyetleri" minvalinde post çık.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd18_a2', task_type: 'field', title: '1 bölge storysi at', description: 'Bugünkü aktivitenden kısa bir kesit yayımla.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 5 },
      { task_key: 'd18_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Aramalarda karşılaştığın 1 nolu itirazı notla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 19,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: 'Alıcı Eşleştirme ve Servis',
    day_lesson_title: 'Cepteki Alıcı',
    day_lesson_body: 'Datanızdaki nitelikli bir alıcı, bir FSBO kapısını çalarken en büyük silahınızdır. "Elinizde müşteriniz var mı?" sorusuna dürüstçe "Evet" diyebilmelisiniz.',
    video_lesson_title: 'Alıcı – Satıcı Eşleştirme Metodolojisi',
    video_lesson_placeholder: 'İzlenecek ders: Alıcı üzerinden portföy almak (yakında)',
    main_objective: 'Aday alıcıların beklentilerini satılık mülklerle eşleştirmek.',
    tasks: [
      { task_key: 'd19_edu', task_type: 'learning', title: 'Alıcı itirazı roleplay\'i', description: '"Bu ev çok pahalı" diyen alıcıya verilecek cevabı yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd19_g1', task_type: 'prospecting', title: '20 telefon/mesaj teması yap', description: 'Önce alıcılarını, sonra alıcılarına uygun ev sahiplerini ara.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd19_g2', task_type: 'networking', title: '1 yüz yüze/kahve görüşmesi', description: 'Alıcınla veya satıcınla yer gösterme/öngörüşme ayarla.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd19_p1', task_type: 'crm', title: '5 alıcı/kiracı kaydı eşleştirmesi yap', description: 'Portaldaki veya kendi ağındaki favori 5 ilanı alıcılarınla eşleştir.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd19_p2', task_type: 'portfolio', title: '1 değer analizi teklifi yap', description: 'Randevular esnasında satıcıları yoklamayı unutma.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd19_a1', task_type: 'content', title: 'Benim Bölgem: Yeni ulaşım/altyapı pojesi', description: 'Bölgedeki metro, hastane gibi değer katan bilgileri paylaş.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd19_a2', task_type: 'field', title: '1 bölge storysi at', description: 'Mahalledeki bir özelliği video çek.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 5 },
      { task_key: 'd19_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Alıcıların iletilen ilanları nasıl karşıladı? Analiz et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 20,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: 'Görünürlüğün Meyvesi: Organik Beklentiler',
    day_lesson_title: 'Aksiyon Varsa Çekim de Vardır',
    day_lesson_body: 'Eğer bir haftadır "Ben bu işi yapıyorum" sinyallerini düzgün verdiyseniz, eski iş yerinizden veya sosyal çevrenizden gelen ilk "Abi bizim evin emlakçı işi var" mesajını görmeye başlayabilirsiniz.',
    video_lesson_title: 'Inbound Pazarlama Gücü',
    video_lesson_placeholder: 'İzlenecek ders: Sosyal medyadan müşteri dönüşümü (yakında)',
    main_objective: 'Sosyal medya/WP durumlarından gelen organik talepleri görmek.',
    tasks: [
      { task_key: 'd20_edu', task_type: 'learning', title: '1 yetki görüşmesi provası (bölüm 2)', description: 'Fiyat itirazında CMA sunma bölümünü tekrar et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd20_g1', task_type: 'prospecting', title: '20 telefon/mesaj teması yap', description: 'Aralıksız devam et, bugünün aramalarını FSBO\'ya çevir.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd20_g2', task_type: 'networking', title: '1 yüz yüze/kahve görüşmesi yap', description: 'Hafta sonu için planladığın sıcak yüz yüze görüşmeni gerçekleştir.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd20_p1', task_type: 'portfolio', title: '2 değer analizi teklifi yap', description: 'WhatsApp toplu mesajlarını/listeni kullan.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd20_p2', task_type: 'crm', title: 'Bekleyen 5 takip kaydını CRM\'de kontrol et', description: 'Bu hafta ertelediğin görüşmeleri kovala.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd20_a1', task_type: 'content', title: '1 faydalı içerik: Hafta sonu ev gezeceklere tavsiyeler', description: 'Tüketiciyi yönlendiren ve danışmana ihityacı hissettiren post.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd20_a2', task_type: 'field', title: '1 bölge storysi at', description: 'Cumartesi/Pazar yoğunluğunu hissettiren story.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 5 },
      { task_key: 'd20_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Organik gelen veya ısınan referans adayı var mı yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 21,
    week_number: 3,
    phase_title: 'Güven ve Görünürlük',
    day_title: '3. Hafta Değerlendirmesi',
    day_lesson_title: 'Momentum Oluşturma',
    day_lesson_body: 'Duran bir kamyonu itmek çok zordur ama hareket halindeki kamyonu sadece küçük bir itmeyle ilerletirsiniz. 21 günde sektörle tanıştınız, şimdi ivmelenme zamanı.',
    video_lesson_title: '21 Günlük Alışkanlık',
    video_lesson_placeholder: 'İzlenecek ders: Motivasyon kaybıyla mücadele (yakında)',
    main_objective: 'İlk 21 günün verilerini analiz etmek.',
    tasks: [
      { task_key: 'd21_edu', task_type: 'learning', title: 'Haftalık değerlendirme raporunu oluştur', description: 'Son bir haftada kaç kişiyle kahve içtin, kaç adaya dokundun raporla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd21_g1', task_type: 'followup', title: 'Geçmiş 20 kişiye ufak selam at', description: 'Cuma/haftasonu selamı vererek hafifçe dokun.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd21_g2', task_type: 'networking', title: 'Mentor veya ofisle kahve toplantısı yap', description: 'Momentumu değerlendir ve ilk adayların hakkında bilgi al.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd21_p1', task_type: 'portfolio', title: 'Haftanın en potansiyel 3 adayını filtrele', description: 'Bu üç kişiye önümüzdeki pazartesi ne sunacaksın, pazar günü düşün.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd21_p2', task_type: 'learning', title: '1 yetki görüşmesi itirazı roleplay\'i yap', description: 'Hazırlıklarını test et.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd21_a1', task_type: 'content', title: '3. haftanın kısa analizini paylaş (kendine)', description: '3 haftada ne kadar gelişim kaydettiğini, nerede zorlandığını yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd21_a2', task_type: 'content', title: '1 haftalık kapanış storysi at', description: 'Planlama/defter pozları, "yeni haftaya hazırız" konsepti.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd21_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'İlk 21 günün genel performans notunu 1-10 arası puanla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  }
,

  {
    day_number: 22,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'FSBO Aramalarında Agresiflik',
    day_lesson_title: 'Mülk Sahibine Veri Yolla',
    day_lesson_body: 'Artık çevrenden ziyade doğrudan satıcılara oynama vakti. "Bölgede uzmanım" demek yetmez, raporunuzla bunu kanıtlamalısınız.',
    video_lesson_title: 'Telefonda Uzmanlık Sergilemek',
    video_lesson_placeholder: 'İzlenecek ders: FSBO cold calling ileri seviye (yakında)',
    main_objective: 'Sahibinden sahiplerine değer analizi teklifini kabul ettirmek.',
    tasks: [
      { task_key: 'd22_edu', task_type: 'learning', title: 'Yetki sunumu taslağını revize et', description: 'Randevuda satıcının önüne koyacağın o "Özel Pazarlama Planı" sayfasını güzelleştir.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd22_g1', task_type: 'prospecting', title: '5 FSBO araması yap', description: 'Günün FSBO kotası.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd22_g2', task_type: 'networking', title: '3 sıcak adaya toplantı teklif et', description: 'Elindeki ılık/sıcak listeden randevu çıkar.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd22_p1', task_type: 'portfolio', title: '1 değer analizi randevusu hedefle', description: 'Tüm günkü hedefin o ilk "Tamam, gel evime bak" sözünü almak.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd22_p2', task_type: 'learning', title: 'Rakip ilan karşılaştırması yap', description: 'Satıcıya "Diğer 5 ilan neden satılamadı?" anlatabilmek için veri topla.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd22_a1', task_type: 'field', title: '1 portföy adayı sıcak/ılık/soğuk ayrımı yap', description: 'Aday tablonun öncelik sırasını kontrol et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd22_a2', task_type: 'content', title: 'Satıcı motivasyon/aciliyet notu çıkar', description: 'Hedef mülk sahibinin neden satmak istediğini CRM\'e detaylı yaz.', gpa_bucket: 'A', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd22_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Bugünkü FSBO temaslarından kaçı olumluydu? Nitelikli kaç dönüş oldu?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 23,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Randevu İtirazları',
    day_lesson_title: 'Yetki Görüşmesine Git',
    day_lesson_body: 'Kimse ilk teklifte yetki vermez. Ancak yüz yüze görüştükten ve analizlerinizi sunduktan sonra güven inşa edilir.',
    video_lesson_title: 'Yüz Yüze Sunum Teknikleri',
    video_lesson_placeholder: 'İzlenecek ders: Randevu iptallerini engelleme (yakında)',
    main_objective: 'Değer analizi sunum randevularında bulunmak.',
    tasks: [
      { task_key: 'd23_edu', task_type: 'learning', title: 'Randevu iptal engelleme script\'i yaz', description: '"Ben satmaktan vazgeçtim" diyen mal sahibine verilecek en iyi yanıtı hazırla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd23_g1', task_type: 'prospecting', title: '5 FSBO araması yap', description: 'Günün FSBO kotası.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd23_g2', task_type: 'followup', title: '10 takip araması gerçekleştir', description: 'Hemen sonuç vermeyen adaylara yumuşak takip.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd23_p1', task_type: 'portfolio', title: '1 değer analizi randevusu hedefle', description: 'Bugünün randevu kotası.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd23_p2', task_type: 'learning', title: 'Rakip ilan karşılaştırması detaylandır', description: 'Emsal mülklerin en zayıf fotoğraf ve açıklamalarını not et, "Biz daha iyisini yaparız" sunumuna ekle.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd23_p3', task_type: 'crm', title: '1 portföy adayı sıcak/ılık/soğuk ayrımı yap', description: 'Bugünkü adayları CRM de gruplandır.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd23_a1', task_type: 'content', title: 'Bölge piyasası durumu postu at', description: 'Görüşme alamasan da bölgedeki aktifliğini dijitalde duyur.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd23_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Randevu alabildin mi? Alamadıysan sunum taslağında ne eksik düşün.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
    ]
  },
  {
    day_number: 24,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Müşteriyi Bilgilendirme Raporu',
    day_lesson_title: 'Mal Sahibine Rapor Verin',
    day_lesson_body: 'Eğer bir portföy aldıysanız, satıcı sizi sadece aradığınız gün hatırlar. Haftalık raporlama sistemi kurarak müşteriyle iletişiminizi profesyonelleştirin.',
    video_lesson_title: 'Söz Verildiği Gibi Raporlama',
    video_lesson_placeholder: 'İzlenecek ders: Malsahibi bilgilendirme sistemi (yakında)',
    main_objective: 'Portföyler için otomatik/düzenli rapor taslağı çıkarmak.',
    tasks: [
      { task_key: 'd24_edu', task_type: 'learning', title: 'Haftalık mal sahibi raporu örneği hazırla', description: 'İlan tıklamaları, favoriler, arama sayılarını içeren bir excel veya PDF şablonu yap.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd24_g1', task_type: 'prospecting', title: '5 FSBO araması yap', description: 'Haftalık arama hedefin için duraksama yok.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd24_g2', task_type: 'crm', title: 'Satıcı aciliyet/motivasyon durumlarını güncelle', description: 'Elindeki satıcı listesini CRM de tarayıp not ekle.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd24_p1', task_type: 'portfolio', title: '1 değer analizi randevusu hedefle', description: 'Sabrın sonu selamet.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd24_p2', task_type: 'portfolio', title: 'Rapor formatını olası bir portföy için doldur', description: 'Test amaçlı, portallardan sahte verilerle raporunu doldur.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd24_a1', task_type: 'field', title: 'Portföy fotoğraf/açıklama kalite kontrolü yap', description: 'Kendi ilanlarında veya bölgedeki en iyi ilanlarda kalite kontrol yap.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd24_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Mal sahipleri için hazırladığın rapor formatını 10 üzerinden puanla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd24_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 25,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Pazarlama Hazırlığı',
    day_lesson_title: 'Açık Ev (Open House) Kurgusu',
    day_lesson_body: 'Daha portföy yetkisi almadan bile bir mülkü nasıl pazarlayacağını adım adım bilmelisin. Satıcıya "Sizin için bir Açık Ev planladım" demek yetki almanızı hızlandırır.',
    video_lesson_title: 'Yer Gösterme ve Etkinlik Planlama',
    video_lesson_placeholder: 'İzlenecek ders: Mükemmel bir Açık Ev nasıl yapılır? (yakında)',
    main_objective: 'Bir pazarlama etkinliği tasarlamak ve sunum gücünü artırmak.',
    tasks: [
      { task_key: 'd25_edu', task_type: 'learning', title: 'İlk açık ev/yer gösterimi hazırlığı yap', description: '"Davetiye kimi çağırırsın, içeride kurabiye/kahve nasıl sunulur?" kurgusunu yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd25_g1', task_type: 'prospecting', title: '5 FSBO araması yap', description: 'Portalı tara, yeni düşen ilanları hemen ara.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd25_g2', task_type: 'networking', title: 'Çevrene "Yatırımlık yer bakan var mı?" sorusunu at', description: 'Whatsapp durumu veya mail ile alıcıları yokla.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd25_p1', task_type: 'portfolio', title: '1 değer analizi randevusu hedefle', description: 'Fırsatı kaçırma, toplantı iste.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd25_p2', task_type: 'learning', title: '1 açık ev davetiye SMS örneği oluştur', description: 'Örnek bir site/mülk için taslak davet mesajı yaz.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd25_a1', task_type: 'content', title: 'Açık Ev stratejini mentorunla/ofisle görüş', description: 'Fikir alışverişi yapıp eksiklerini kapa.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
      { task_key: 'd25_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Bugünkü çalışmalarının yetki almak için sana hız katıp katmadığını değerlendir.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd25_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 26,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Satıcı Psikolojisi',
    day_lesson_title: 'Satıcıyla Empati',
    day_lesson_body: 'Kimse evini "ucuza gitsin" diye satmaz. Ancak "zaman" para demektir. Doğru bir değer analizi raporu, satıcının fiyat realitesiyle yüzleşmesini sağlayan acısız bir ilaçtır.',
    video_lesson_title: 'Fiyatı Düşürme İkna Stratejileri',
    video_lesson_placeholder: 'İzlenecek ders: Şişkin fiyata sahip malsahibiyle çalışma (yakında)',
    main_objective: 'Fiyat görüşmelerinde objektif kalabilmek.',
    tasks: [
      { task_key: 'd26_edu', task_type: 'learning', title: 'Fiyat yüksek itirazında CMA sunma roleplayi', description: '"Komşum o fiyata sattı" diyene verilerle karşı çıkarma antrenmanı.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd26_g1', task_type: 'prospecting', title: '5 FSBO araması yap', description: 'Sabırla listeyi eritmeye devam.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd26_g2', task_type: 'followup', title: 'Bölge uzmanı olduğun mesajını 5 kişiye hissettir', description: '"Bakın sizin evin sokağında fiyatlar ne oldu" mesajı yolla.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 15 },
      { task_key: 'd26_p1', task_type: 'portfolio', title: '1 değer analizi randevusu hedefle', description: 'Hedefini şaşma.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd26_p2', task_type: 'learning', title: 'Rakip ilan karşılaştırması detaylandır', description: 'Veri setini güncelle.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd26_a1', task_type: 'field', title: 'Satıcı motivasyon/aciliyet notu çıkar', description: 'Görüşmedekilerin paraya ne zaman ihtiyacı var analiz et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd26_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Satıcı mı çok direndi, sen mi zayıf savundun? Yaz.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd26_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 27,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Saha Denetimi',
    day_lesson_title: 'Son Rötüşler ve Reklam Kalitesi',
    day_lesson_body: 'Portföye çıkmadan önceki son denetim çok kritiktir. Fotoğraf kalitesi kötü bir ilan, potansiyel komisyonu %20 düşürebilir ve satış süresini 45 gün uzatır.',
    video_lesson_title: 'Gayrimenkul Fotoğrafçılığı ve Metin',
    video_lesson_placeholder: 'İzlenecek ders: Telefonla profesyonel iç mekan çekimi (yakında)',
    main_objective: 'Varsayımsal bir ilanın pazarlama materyallerini kusursuz hale getirmek.',
    tasks: [
      { task_key: 'd27_edu', task_type: 'learning', title: 'Portföy fotoğraf/açıklama kalite kontrolü listesi oluştur', description: 'Çekimlerde ışık, açı, toplanmış eşya düzeni için checklist hazırla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd27_g1', task_type: 'prospecting', title: 'Önceki haftalardaki tüm sıcak adaylarına toplu 1 mesaj çık', description: 'Cuma / Hafta sonu iyi dilekleri ve son gelişmeler.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd27_g2', task_type: 'networking', title: 'Bölgedeki site görevlisi / esnafla 1 çay iç', description: 'Yeni bir haber var mı kontrol et.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd27_p1', task_type: 'portfolio', title: 'Olası ilk yetkili ilan taslağını sisteme (CRM veya taslak olarak) gir', description: 'Açıklama metnini hikayeleştirerek yaz.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd27_p2', task_type: 'crm', title: '1 portföy adayı sıcak/ılık/soğuk ayrımı yap', description: 'Yeni haftaya verimli bir adayla girmek için elenmesi gerekeni ele.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd27_a1', task_type: 'content', title: 'Hafta sonu Açık Ev veya tanıtım için Sosyal Medya postu', description: 'Yetkili olmasan da ofisinin/takımının bir portföyü için destek ol.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd27_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'İlan açıklaman (copywriting) yeteneğin ne durumda? Gelişecek yanını bul.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd27_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 28,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Aylık Rapora Hazırlık',
    day_lesson_title: 'Data Toplama Günü',
    day_lesson_body: '30 günün bitmesine çok az kaldı. Sahada, CRM\'de ve eğitimde ektiğin tohumları ölçmek meslekte kalıcı olmanın tek anahtarıdır. Bugün sadece topla.',
    video_lesson_title: 'Büyük Veri',
    video_lesson_placeholder: 'İzlenecek ders: Gayrimenkulde veri analizi ve hedef düzeltmesi (yakında)',
    main_objective: 'Bir aylık rakamsal veriyi toparlayıp ilk büyük rapora hazırlamak.',
    tasks: [
      { task_key: 'd28_edu', task_type: 'learning', title: 'İlk ayın verilerini çekmeye başla', description: 'CRM\'e girip tüm kontak ve aday listelerini kontrol et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd28_g1', task_type: 'followup', title: 'Bugün hiç aramadığın 10 kişiyi ara', description: 'Eski "belki" dediğin kişilerden randevu talep et.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd28_p1', task_type: 'portfolio', title: 'Mal sahipleri için eksik verini tamamla', description: 'Sıcak/Ilık tüm liste için satıcı motivasyonu notunu girmiş ol.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd28_p2', task_type: 'learning', title: 'Rakip ilan karşılaştırması üzerinden bölge özetini al', description: 'Sattı mı, ilandan mı kalktı?', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
      { task_key: 'd28_p3', task_type: 'crm', title: 'Haftalık mal sahibi raporu örneği kurgusunu kesinleştir', description: 'Bir yetkin olunca kullanacağın şablon hazır olsun.', gpa_bucket: 'P', difficulty: 'bonus', xp_reward: 10 },
      { task_key: 'd28_a1', task_type: 'learning', title: 'Yetki sunumu taslağı üzerinden son kez geç', description: 'İlk yetki görüşmen ne kadar profesyonel olacak, aynada 5 dk tekrar et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd28_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Bütün verileri topladığında karşına çıkan en zayıf halkan ne oldu?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd28_gen01', task_type: 'prospecting', title: '2 yeni alıcı eşleştirme araması', description: 'Bekleyen portföyleri potansiyel alıcılara sun.', gpa_bucket: 'G', difficulty: 'recommended', xp_reward: 10 }
    ]
  },
  {
    day_number: 29,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Odaklı Takip ve İvme',
    day_lesson_title: 'Son Bir Gayret',
    day_lesson_body: '30 günlük döngünün sonlarındayız. Bugüne kadar tohumları ektin; artık tarlayı düzeltip hangi fidenin meyve vereceğini seçme zamanı.',
    video_lesson_title: 'Zaman Yönetimi Matrixsi',
    video_lesson_placeholder: 'İzlenecek ders: Acil vs Önemli iş karması (yakında)',
    main_objective: 'Bir sonraki ay için potansiyel komisyonlarını hizalamak.',
    tasks: [
      { task_key: 'd29_edu', task_type: 'learning', title: 'Zaman yönetimi analizin', description: 'Geçen 29 gün boyunca vaktinin ne kadarı boşa gitti çıkar.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd29_g1', task_type: 'prospecting', title: 'En olumlu randevularından 3 tanesine hatırlatma / dokunma yap', description: '"Söylediğiniz evle alakalı şöyle bir gelişme oldu" diyerek dön.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd29_p1', task_type: 'portfolio', title: 'Karar vermesi yakın 1 mal sahibiyle temas et', description: 'Aciliyet notunu incele ve "Tam zamanı, ilanlara girelim" de.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd29_a1', task_type: 'crm', title: 'Alıcı-Satıcı listelerinde tam ayrım yap', description: 'Tamamen "Cop" dediğin kayıtları arşive at, önünü aç.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd29_rev', task_type: 'review', title: 'Gün sonu ölçümü', description: 'Bütün bu filtrelemeden sonra 2. aya ne kadar kalifiye adayla gireceksin?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd29_xt1', task_type: 'learning', title: 'İlk ay temas sayısı özetini çıkar', description: 'Ay sonu değerlendirmesine hazırlık.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd29_xt2', task_type: 'crm', title: 'CRM kayıt sayısı analizi', description: 'Bu ay kaç yeni kayıt girdiğini raporla.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd29_xt3', task_type: 'portfolio', title: 'Portföy adayı sayılarını derle', description: 'Mevcut aday potansiyelini özetle.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 }
    ]
  },
  {
    day_number: 30,
    week_number: 4,
    phase_title: 'Değer Analizinden Yetkili Portföye',
    day_title: 'Aylık Kapanış ve Final Raporu',
    day_lesson_title: 'Data Seni Eleştirsin',
    day_lesson_body: 'İşte o gün! İlk ay geride kaldı. Neler yapabildin? Belki listelerin boş kaldı, belki harika randevular çıkardın. Önemli olan sistemi benimsemekti.',
    video_lesson_title: 'İlk 30 Günün Analizi',
    video_lesson_placeholder: 'İzlenecek ders: Kamp sürecinin sürdürülebilirliği (yakında)',
    main_objective: 'Tüm faaliyetlerin somut bir raporunu çıkarıp 2. aya start vermek.',
    tasks: [
      { task_key: 'd30_edu', task_type: 'learning', title: 'İlk ay özet formunu dürüstçe doldur', description: 'Kaç temas, Kaç CRM kaydı, Kaç alıcı/kiracı, Kaç mülk sahibi, Kaç CMA net çıkar.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 35 },
      { task_key: 'd30_g1', task_type: 'learning', title: 'Kaç yetki görüşmesi ve potansiyel sayısını hesapla', description: 'Yetki alamasan da kaç kez masaya oturdun onu tespit et.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd30_p1', task_type: 'learning', title: 'En güçlü kanal & En zayıf alışkanlık tespiti yap', description: 'Müşteri sana çoklukla DM den mi FSBO\'dan mı geldi? Hangi görevden hep kaçtın?', gpa_bucket: 'P', difficulty: 'required', xp_reward: 20 },
      { task_key: 'd30_a1', task_type: 'learning', title: 'İkinci ay hedefini mentorunla / ofisle paylaş', description: 'Rakamlarını sun ve "İkinci ayki hedefim budur" beyanında bulun.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 25 },
      { task_key: 'd30_rev', task_type: 'review', title: 'Bir Aylık Serüven', description: 'Bugüne kadar kendine eziyet mi ettin, geliştiğini hissettin mi? Son reviewini yap ve 2. aya güçlü başla!', gpa_bucket: 'A', difficulty: 'required', xp_reward: 30 },
      { task_key: 'd30_xt1', task_type: 'learning', title: 'CMA ve değer analizi sayısı', description: 'Yaptığın değerlemeleri listele.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd30_xt2', task_type: 'learning', title: 'En güçlü kanal belirlemesi', description: 'Hangi kaynaktan en çok müşteri aldın?', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd30_xt3', task_type: 'learning', title: 'En zayıf alışkanlık tespiti', description: 'Zaman çalan kötü alışkanlığını not et.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
      { task_key: 'd30_xt4', task_type: 'planning', title: 'İkinci ay hedefi planlaması', description: 'Gelecek ay için rakamsal hedefini belirle.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 }
    ]
  },
  ...days31to37 as CampaignDayTemplate[],
  ...days38to45 as CampaignDayTemplate[],
  ...days46to52 as CampaignDayTemplate[],
  ...days53to60 as CampaignDayTemplate[],
  ...days61to67 as any as CampaignDayTemplate[],
  ...days68to75 as any as CampaignDayTemplate[],
  ...days76to83 as any as CampaignDayTemplate[],
  ...days84to90 as any as CampaignDayTemplate[]
];
