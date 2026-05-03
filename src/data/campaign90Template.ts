// 90 Day Campaign 13-week templates

export interface CampaignTemplateTask {
  task_key: string;
  task_type: string;
  title: string;
  description: string;
  gpa_bucket: 'G' | 'P' | 'A';
  xp_reward: number;
}

export interface CampaignWeekTemplate {
  week_number: number;
  title: string;
  daily_tasks: CampaignTemplateTask[];
}

export const CAMPAIGN_90_TEMPLATE: CampaignWeekTemplate[] = [
  {
    week_number: 1,
    title: "Sünger Modu",
    daily_tasks: [
      { task_key: 'w1_t1', task_type: 'learning', title: 'Niyet mektubunu yaz', description: 'Neden bu işi yaptığını ve 90 gün sonra nerede olmak istediğini yaz.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w1_t2', task_type: 'crm', title: 'CRM’e ilk 50 kişiyi ekle', description: 'Rehberindeki en yakın 50 kişiyi CRM sistemine kaydet.', gpa_bucket: 'G', xp_reward: 50 },
      { task_key: 'w1_t3', task_type: 'learning', title: 'Mentor / başarılı danışman belirle', description: 'Örnek alacağın 2 başarılı danışmanı incele.', gpa_bucket: 'A', xp_reward: 10 },
      { task_key: 'w1_t4', task_type: 'review', title: 'Profesyonel imaj checklist’ini tamamla', description: 'Sosyal medya profilleri, WhatsApp fotoğrafı ve biyografini kontrol et.', gpa_bucket: 'A', xp_reward: 15 },
      { task_key: 'w1_t5', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: 'Gün sonunda yaptığın aktiviteleri değerlendir.', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 2,
    title: "Bölge Hakimiyeti",
    daily_tasks: [
      { task_key: 'w2_t1', task_type: 'learning', title: '20 ilan analizi yap', description: 'Bölgendeki satılık/kiralık 20 ilanı incele.', gpa_bucket: 'A', xp_reward: 30 },
      { task_key: 'w2_t2', task_type: 'field', title: '5 sokak/site notu ekle', description: 'Bölge turu yap ve saha notlarını Harita modülüne kaydet.', gpa_bucket: 'A', xp_reward: 50 },
      { task_key: 'w2_t3', task_type: 'portfolio', title: 'Bölge fiyat aralığını çıkar', description: 'Bölgendeki m2 fiyat ortalamalarını not et.', gpa_bucket: 'P', xp_reward: 20 },
      { task_key: 'w2_t4', task_type: 'review', title: 'En iyi 5 rakip ilanı analiz et', description: 'Rakiplerinin nasıl pazarlama yaptığını incele.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w2_t5', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: 'Gün sonunda aktiviteleri gözden geçir.', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 3,
    title: "Etki Çevresi",
    daily_tasks: [
      { task_key: 'w3_t1', task_type: 'prospecting', title: '20 sıcak çevre araması yap', description: 'Aileni ve arkadaşlarını arayıp yeni işini duyur.', gpa_bucket: 'G', xp_reward: 50 },
      { task_key: 'w3_t2', task_type: 'prospecting', title: '5 yüz yüze/kahve görüşmesi planla', description: 'Geçmiş iş bağlantılarınla kahve randevusu ayarla.', gpa_bucket: 'G', xp_reward: 40 },
      { task_key: 'w3_t3', task_type: 'crm', title: 'CRM kayıtlarına takip tarihi ata', description: 'Tüm kişilerin bir sonraki aranma tarihini belirle.', gpa_bucket: 'G', xp_reward: 20 },
      { task_key: 'w3_t4', task_type: 'content', title: 'İlk duyuru mesajını gönder', description: 'Özel hazırladığın şablonla profesyonel bir mesaj at.', gpa_bucket: 'G', xp_reward: 30 },
      { task_key: 'w3_t5', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: 'Bugünün skorunu ölç.', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 4,
    title: "FSBO / Değer Analizi",
    daily_tasks: [
      { task_key: 'w4_t1', task_type: 'prospecting', title: '10 sahibinden ilan sahibiyle temas kur', description: 'FSBO aramaları yap.', gpa_bucket: 'G', xp_reward: 50 },
      { task_key: 'w4_t2', task_type: 'portfolio', title: '2 değer analizi randevusu hedefle', description: 'Mülkünün gerçek değerini merak edenlere analiz teklif et.', gpa_bucket: 'P', xp_reward: 40 },
      { task_key: 'w4_t3', task_type: 'prospecting', title: '1 yetki görüşmesi planla', description: 'Potansiyel bir müşteri ile yetki alma görüşmesi ayarla.', gpa_bucket: 'G', xp_reward: 30 },
      { task_key: 'w4_t4', task_type: 'crm', title: 'İtirazları CRM notu olarak yaz', description: 'Aldığın hayır cevaplarını ve nedenlerini not et.', gpa_bucket: 'A', xp_reward: 15 },
      { task_key: 'w4_t5', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 5,
    title: "Benim Bölgem İçerik Serisi",
    daily_tasks: [
      { task_key: 'w5_t1', task_type: 'content', title: '1 bölge içeriği üret', description: 'Uzmanlık bölgen hakkında faydalı bir post hazırla.', gpa_bucket: 'A', xp_reward: 30 },
      { task_key: 'w5_t2', task_type: 'content', title: '1 story paylaş', description: 'Sahadayken veya analiz yaparken bir story at.', gpa_bucket: 'A', xp_reward: 15 },
      { task_key: 'w5_t3', task_type: 'crm', title: '5 alıcı/kiracı kaydı oluştur', description: 'Portföy arayan kişilerin taleplerini sisteme gir.', gpa_bucket: 'G', xp_reward: 20 },
      { task_key: 'w5_t4', task_type: 'followup', title: '10 DM/yorum etkileşimi yap', description: 'Bölgendeki sayfalara anlamlı yorumlar bırak.', gpa_bucket: 'G', xp_reward: 20 },
      { task_key: 'w5_t5', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 6,
    title: "Saha Networkü",
    daily_tasks: [
      { task_key: 'w6_t1', task_type: 'field', title: '5 esnaf/site/network teması kur', description: 'Bölgendeki yerel işletmelerle tanış.', gpa_bucket: 'G', xp_reward: 50 },
      { task_key: 'w6_t2', task_type: 'crm', title: '2 referans ortağı adayı ekle', description: 'Seni başkalarına tavsiye edebilecek 2 kişi bul.', gpa_bucket: 'P', xp_reward: 30 },
      { task_key: 'w6_t3', task_type: 'field', title: 'Bölgem’e saha noktası ekle', description: 'Önemli projeleri haritaya iğnele.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w6_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 7,
    title: "CRM Disiplini",
    daily_tasks: [
      { task_key: 'w7_t1', task_type: 'crm', title: 'Takip tarihi olmayan kayıtları tamamla', description: 'Tüm listenin bir sonraki eylemi olsun.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w7_t2', task_type: 'followup', title: '10 takip araması/mesajı yap', description: 'Geçmiş kontaklarına "Nasılsınız?" de.', gpa_bucket: 'G', xp_reward: 40 },
      { task_key: 'w7_t3', task_type: 'followup', title: 'Sessiz adayları yeniden uyandır', description: 'Soğumuş leadlere ilgi çekici bir portföy/bilgi at.', gpa_bucket: 'G', xp_reward: 30 },
      { task_key: 'w7_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 8,
    title: "Yetki Sunumu",
    daily_tasks: [
      { task_key: 'w8_t1', task_type: 'portfolio', title: '1 CMA/değer analizi hazırla', description: 'Gerçek bir mülk için rapor oluştur.', gpa_bucket: 'P', xp_reward: 40 },
      { task_key: 'w8_t2', task_type: 'learning', title: '1 yetki sunumu provası yap', description: 'Ayna karşısında veya bir meslektaşla prova yap.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w8_t3', task_type: 'prospecting', title: '1 mülk sahibiyle yetki görüşmesi yap', description: 'Sözleşme imzalamak için vizyonunu aktar.', gpa_bucket: 'P', xp_reward: 50 },
      { task_key: 'w8_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 9,
    title: "Portföy Pazarlama",
    daily_tasks: [
      { task_key: 'w9_t1', task_type: 'portfolio', title: 'Portföy ilan kalitesini kontrol et', description: 'Fotoğraf, açıklama ve başlıkları optimize et.', gpa_bucket: 'P', xp_reward: 20 },
      { task_key: 'w9_t2', task_type: 'crm', title: 'Mal sahibine haftalık rapor hazırla', description: 'Portföy izlenme/arama istatistiklerini raporla.', gpa_bucket: 'P', xp_reward: 30 },
      { task_key: 'w9_t3', task_type: 'prospecting', title: 'Alıcı eşleştirme yap', description: 'Elindeki alıcı adaylarına portföylerini sun.', gpa_bucket: 'G', xp_reward: 40 },
      { task_key: 'w9_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 10,
    title: "Alıcı Yönetimi",
    daily_tasks: [
      { task_key: 'w10_t1', task_type: 'crm', title: '3 alıcı kartı tamamla', description: 'Alıcıların net bütçe/bölge/istek listesini gir.', gpa_bucket: 'G', xp_reward: 20 },
      { task_key: 'w10_t2', task_type: 'portfolio', title: 'Her alıcıya 3 opsiyonlu öneri hazırla', description: 'En uygun fırsatları sun.', gpa_bucket: 'P', xp_reward: 30 },
      { task_key: 'w10_t3', task_type: 'followup', title: 'Gösterim sonrası 24 saat takip yap', description: 'Mülk gösterdiğin müşteriyi ara ve fikrini sor.', gpa_bucket: 'G', xp_reward: 30 },
      { task_key: 'w10_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 11,
    title: "Teklif ve Müzakere",
    daily_tasks: [
      { task_key: 'w11_t1', task_type: 'portfolio', title: '1 teklif dosyası hazırla', description: 'Resmi veya yazılı bir teklif süreci yönet.', gpa_bucket: 'P', xp_reward: 50 },
      { task_key: 'w11_t2', task_type: 'prospecting', title: '“Karar vermek için ne eksik?” sorusunu kullan', description: 'Beklemede olan alıcılara bu mesajı at.', gpa_bucket: 'G', xp_reward: 20 },
      { task_key: 'w11_t3', task_type: 'learning', title: 'Kayıp/itiraz nedenini not et', description: 'Kapanmayan işlerden ders çıkar ve not al.', gpa_bucket: 'A', xp_reward: 15 },
      { task_key: 'w11_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 12,
    title: "Operasyon",
    daily_tasks: [
      { task_key: 'w12_t1', task_type: 'review', title: 'Tapu/kiralama checklist’ini gözden geçir', description: 'Saha/ofis operasyon adımlarını temizle.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w12_t2', task_type: 'followup', title: 'Müşteri memnuniyet sorusu gönder', description: 'Eski müşterilerine hizmetini nasıl bulduklarını sor.', gpa_bucket: 'P', xp_reward: 30 },
      { task_key: 'w12_t3', task_type: 'prospecting', title: 'Referans iste', description: 'Son kiralama/satış yaptığın 1 kişiden yeni müşteri referansı al.', gpa_bucket: 'G', xp_reward: 40 },
      { task_key: 'w12_t4', task_type: 'gpa', title: 'Bugünün GPA kapanışını yap', description: '', gpa_bucket: 'A', xp_reward: 25 },
    ]
  },
  {
    week_number: 13,
    title: "90 Gün Raporu",
    daily_tasks: [
      { task_key: 'w13_t1', task_type: 'review', title: '90 gün self-audit hazırla', description: 'Neler iyi gitti, nerelerde gelişim gerek.', gpa_bucket: 'A', xp_reward: 50 },
      { task_key: 'w13_t2', task_type: 'learning', title: 'En iyi kanalını belirle', description: 'Sana en çok lead getiren kaynağı analiz et.', gpa_bucket: 'A', xp_reward: 20 },
      { task_key: 'w13_t3', task_type: 'learning', title: 'Yeni 90 gün hedefini yaz', description: 'İkinci çeyrek hedeflerini CRM’e ekle.', gpa_bucket: 'A', xp_reward: 30 },
      { task_key: 'w13_t4', task_type: 'content', title: '“Gayrimenkulde İlk 90 Günüm” içerik taslağını oluştur', description: 'LinkedIn/Instagram için tecrübelerini anlatan bir yazı yaz.', gpa_bucket: 'A', xp_reward: 30 },
      { task_key: 'w13_t5', task_type: 'gpa', title: 'Kamp kapanış GPA raporunu tamamla', description: 'Toplam skorunu ve kamp bitişini onayla.', gpa_bucket: 'P', xp_reward: 100 },
    ]
  }
];
