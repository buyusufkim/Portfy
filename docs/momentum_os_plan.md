# Momentum OS - Plan Dokümantasyonu

## 1. Feature List (Onaylı 13 Madde)

1. Akıllı İçerik Takvimi
2. Mikro Hedef Sistemi
3. Territory Planning
4. Referral Engine
5. İlk 7 Gün Aktivasyon Programı
6. Sahip Portalı Trafik Motoru
7. Gün Sonu Kapanış Ritüeli
8. Lead Sessizleşme Uyarıları
9. Sabah 10 Dakika Planı
10. “Aradın mı?” Takip Disiplini
11. Portföy Satılamıyorsa Sebep Zorunlu
12. Haftalık İş Sonucu Panosu
13. Müşteri Unutma Koruması

## 2. Technical Dependency Order

1. **Veritabanı (Supabase)**: Yeni tabloların (hedefler, içerik takvimi, referral) ve tablo güncellemelerinin (lead takip metrikleri, portföy iptal sebepleri) şemaya eklenmesi.
2. **Backend (API)**: İlgili tablo endpoint'lerinin oluşturulması ve Supabase fonksiyonlarının/tetikleyicilerinin yazılması.
3. **Frontend (UI & State)**: React Query hook'larının, component güncellemelerinin, zorunlu giriş ekranlarının (kapanış ritüeli, satılamama sebebi) ve dashboard modüllerinin entegrasyonu.
4. **Jobs / Background**: Unutulan müşteri bildirimlerini ve haftalık iş sonuçlarını tetikleyen mekanizmaların kurulumu.

## 3. Implementation Checklist

### Backend
- [ ] `leads` ve `contacts` tablolarına `last_contacted_at` (Müşteri Unutma / Lead Sessizleşme) alanı ekle.
- [ ] `properties` tablosuna `unsold_reason` zorunlu kısıtı ekle (durum değişikliği için).
- [ ] `content_calendar` veri modelini ve API'sini oluştur.
- [ ] `micro_goals` veri modelini ve API'sini oluştur.
- [ ] `referrals` motoru için altyapı ekle.
- [ ] İlk 7 gün aktivasyon check-list verilerini tutacak mimariyi kur.
- [ ] Sahip portalı trafik webhook/log sistemini yapılandır (Trafik motoru).

### Frontend
- [ ] Dashboard'a "Sabah 10 Dakika Planı" ve "Gün Sonu Kapanış" modallerini/bölümlerini ekle.
- [ ] Müşteri unutma uyarıları ve "Aradın mı?" bildirim ui/ux elementlerini tasarla.
- [ ] Portföy status değiştirme formunda "Satılamıyorsa Sebep" zorunlu doğrulamasını (validation) uygula.
- [ ] Akıllı İçerik Takvimi ve Mikro Hedef Sistemi görünümlerini oluştur.
- [ ] Territory Planning harita tabanlı geliştirmelerini ve görünümlerini yap.
- [ ] Haftalık İş Sonucu Panosu bileşenini raporları gösterecek şekilde tasarla.
- [ ] İlk 7 Gün Aktivasyon Programı adımlarını onboarding serisi gibi kullanıcıya göster.

### Jobs
- [ ] "Lead Sessizleşme" ve "Müşteri Unutma" senaryolarını veritabanında tarayıp listeye düşürecek mekanizmayı kodla.
- [ ] Haftalık iş raporu derlemesi için task çalıştır.

## 4. Acceptance Criteria

- [ ] Sadece belirtilen 13 unsur sistemin bir parçası olmalı.
- [ ] Saha ve portföy operasyonları sırasında sebepsiz işlem kapanışı yapılmamalı (Portföy Satılamıyorsa Sebep Zorunlu).
- [ ] Lead ve Takiplerde belirlenen periyotta interaksiyon yoksa, uygulamanın uyarı göstermesi çalışmalı.
- [ ] Gün başlangıç ve kapanış süreçleri çalışabilir ritüeller olarak uygulamada tecrübe edilebilmeli.
