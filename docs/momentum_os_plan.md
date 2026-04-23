# Momentum OS - Plan Dokümantasyonu

Bu belge, Momentum OS özelliğinin geliştirme planını özetlemektedir.

## 1. Özellik Listesi (13 Öğe)

1.  **Momentum Puanı Gösterimi**: Kullanıcının mevcut momentum puanını ve seviyesini dashboard'da görsel olarak gösterme.
2.  **AI Koç Önerileri**: Kullanıcının momentumuna ve güncel durumuna göre kişiselleştirilmiş AI koç önerileri sunma.
3.  **Ghosting Önleyici (Akıllı Takip)**: Tamamlanmamış drip kampanyalarını veya takip görevlerini önceliklendirerek gösterme ve hatırlatma.
4.  **Günün Görevleri (Gamified)**: Kullanıcının günlük görevlerini, kazanılan XP puanları ile birlikte listeleme ve tamamlama özelliği.
5.  **Günü Kapat (Day Closer)**: Günlük performansı özetleme ve seriyi koruma mekanizması.
6.  **Günü Kurtarma (Rescue Session)**: Günlük ilerlemesi düşük olan kullanıcılar için özel bir "günü kurtarma" oturumu başlatma.
7.  **Akıllı Öneriler (Portföy Fiyat Revizesi)**: Piyasa analizine göre fiyat revizesi gerektiren portföyleri belirleyip önerme.
8.  **Saha Ziyareti Check-in (Radar Modu)**: Kullanıcının konumuna göre belirli bir yarıçap içindeyken saha ziyaretlerini CRM'e kaydetme.
9.  **Harita Üzerinde Filtreleme ve Arama**: Saha pinlerini, portföyleri ve diğer öğeleri kategoriye, konuma ve anahtar kelimeye göre filtreleme ve arama.
10. **Anlık Konum Takibi**: Kullanıcının harita üzerindeki canlı konumunu gösterme ve takip etme özelliği.
11. **Yeni Kategori/Filtre Ekleme**: Kullanıcıların harita üzerinde özel filtreler (kategoriler) oluşturabilmesi.
12. **Trafik Motoru (Sinyal Entegrasyonu)**: Belirli bir portföy görüntülendiğinde (örn. rapor incelemesi) otomatik olarak ilgili kullanıcıya bir takip görevi oluşturma.
13. **Gelir Görünümü ve Pipeline Analizi**: Gelir istatistiklerini ve satış pipeline'ını görselleştirme.

## 2. Teknik Bağımlılık Sırası

1.  **Backend (API & Veritabanı)**:
    *   `properties` tablosuna `owner` ve `behavior_metrics` alanlarının eklenmesi.
    *   `tasks` tablosuna `is_drip`, `ai_suggestion`, `drip_type`, `category` gibi alanların eklenmesi/güncellenmesi.
    *   `leads` tablosuna `property_id`, `behavior_metrics` gibi alanların eklenmesi.
    *   `field_visits` tablosuna `user_id`'nin otomatik atanması.
    *   Yeni `momentum_stats` veya benzeri bir tablonun oluşturulması (eğer gerekiyorsa).
    *   Momentum puanı hesaplama ve güncelleme servislerinin backend'de oluşturulması.
    *   AI Koç önerileri için backend servislerinin hazırlanması.
    *   Trafik Motoru (Sinyal) için görev oluşturma endpoint'inin hazırlanması.
    *   Konum verilerini işleyecek ve CRM'e kaydedecek servislerin (örn. `addVisit`, `addMapPin`, `addLead`) güncellenmesi.
2.  **Frontend (UI & State Management)**:
    *   `types.ts` dosyasında gerekli tüm tip tanımlamalarının güncellenmesi ve eklenmesi.
    *   `DashboardView` component'inde Momentum, AI Koç, Ghosting Önleyici, Görevler ve Günü Kapat UI'larının ve mantığının entegrasyonu.
    *   `LeadDetailModal` component'inde ilgili güncellemeler.
    *   `RegionMap` component'inde konum takibi, check-in, filtreleme, arama ve pin ekleme UI/UX iyileştirmeleri.
    *   `BolgemView` component'inde harita ve liste görünümü arasındaki geçişlerin, filtreleme ve arama fonksiyonlarının entegrasyonu.
    *   `MainContentRouter`'da yeni sayfaların (örn. AI Koç) rotalara eklenmesi ve `PremiumGate` ile korunması.
    *   `UpgradeModal` component'inin entegrasyonu.
3.  **Jobs / Background Processing**:
    *   Momentum puanı hesaplamalarının periyodik olarak çalıştırılması (eğer anlık değilse).
    *   AI Koç önerilerinin periyodik olarak veya tetiklendiğinde üretilmesi.
    *   Trafik Motoru sinyallerinin işlenmesi.

## 3. Uygulama Kontrol Listesi

### Backend
*   [ ] `properties` tablosuna `owner` ve `behavior_metrics` alanları eklendi.
*   [ ] `tasks` tablosuna `is_drip`, `ai_suggestion`, `drip_type`, `category` alanları eklendi/güncellendi.
*   [ ] `leads` tablosuna `property_id`, `behavior_metrics` alanları eklendi.
*   [ ] `field_visits` tablosuna `user_id` otomatik atanacak şekilde servis güncellendi.
*   [ ] `api.ts`'de `addMapPin`, `addVisit`, `addLead` servisleri konum ve zaman damgaları ile güncellendi.
*   [ ] `propertyService.ts`'de `addLeadFromProperty` ve `addLeadFromPropertyUpdate` servisleri `created_at` ile güncellendi.
*   [ ] `whatsappService.ts`'de `addLeadFromWhatsAppAnalysis` servisi `created_at` ile güncellendi.
*   [ ] `portal-api.ts`'de `properties` sorgusuna `owner` eklendi.
*   [ ] `portal-api.ts`'de Trafik Motoru sinyali için görev oluşturma mantığı eklendi.
*   [ ] Momentum puanı hesaplama mantığı (eğer backend'de ise) geliştirildi.
*   [ ] AI Koç önerileri için backend servisleri hazırlandı.

### Frontend
*   [ ] `src/types.ts` dosyasında tüm tip tanımlamaları güncellendi (`LeadStatus`, `Task`, `Lead` vb.).
*   [ ] `DashboardView.tsx`:
    *   Momentum, AI Koç, Ghosting Önleyici, Görevler, Günü Kapat UI'ları entegre edildi.
    *   Premium erişim kontrolleri eklendi.
    *   Konum takibi ve gün başlangıç/bitiş mantığı eklendi.
    *   `UpgradeModal` entegre edildi.
    *   `toast` import'u eklendi.
*   [ ] `LeadDetailModal.tsx`: UI ve import'lar güncellendi, "SMART FOLLOW-UP SERIES" modülü eklendi.
*   [ ] `RegionMap.tsx`:
    *   Konum takibi (`isTracking`, `userLocation`, `watchIdRef`) ve check-in (`isCheckingIn`, `handleCheckIn`) özellikleri eklendi.
    *   "nearby" filtre seçeneği ve ilgili mantık eklendi.
    *   Harita kontrol butonları (Pin Ekle, Katmanlar, Konum Bul) yeniden düzenlendi ve z-index ayarları yapıldı.
    *   "Live Tracking Active" uyarı balonu eklendi.
    *   `MapController` component'i oluşturuldu.
    *   `handleLocateMe` prop'u güncellendi.
*   [ ] `BolgemView.tsx`:
    *   Harita ve liste görünümü arasındaki geçişler, filtreleme, arama ve pin ekleme özellikleri geliştirildi.
    *   Konum takibi (`handleToggleTracking`) ve ilgili UI elementleri eklendi.
    *   "Add Pin Modal" ve "Field Notes Drawer" UI'ları güncellendi.
    *   "nearby" filtre için konum kontrolü eklendi.
    *   Harita odaklama mantığı güncellendi.
*   [ ] `MainContentRouter.tsx`: Yeni sayfalar (AI Koç) rotalara eklendi ve `PremiumGate` ile korundu.
*   [ ] `package.json`'da `vite` bağımlılığı güncellendi.

### Jobs / Background Processing
*   [ ] Momentum puanı hesaplama işleri (eğer backend'de periyodik ise) yapılandırıldı.
*   [ ] AI Koç önerileri üretim işleri (eğer periyodik ise) yapılandırıldı.
*   [ ] Trafik Motoru sinyallerini işleyen background job'lar (eğer varsa) yapılandırıldı.

## 4. Kabul Kriterleri

*   Kullanıcı, dashboard'da momentum puanını, AI koç önerilerini ve günün görevlerini doğru bir şekilde görebilmelidir.
*   Ghosting Önleyici özelliği, tamamlanmamış takip görevlerini doğru bir şekilde listeleyip kullanıcıya aksiyon alması için bildirimde bulunmalıdır.
*   "Günü Kapat" özelliği, kullanıcının günlük ilerlemesini kaydetmeli ve seri koruma mekanizmasını desteklemelidir.
*   "Günü Kurtarma" özelliği, düşük ilerlemeli günlerde aktif olmalı ve kullanıcıya yardımcı olmalıdır.
*   Saha Ziyareti Check-in özelliği, kullanıcının konumuna göre doğru bir şekilde çalışmalı ve ziyaretleri CRM'e kaydetmelidir.
*   Harita üzerinde filtreleme, arama ve anlık konum takibi özellikleri beklendiği gibi çalışmalıdır.
*   Yeni kategori ekleme özelliği, harita filtrelerini güncelleyebilmelidir.
*   Trafik Motoru sinyali, ilgili portföy görüntülendiğinde doğru bir takip görevi oluşturmalıdır.
*   Tüm özellikler, premium üyelik gerektirenler için `PremiumGate` tarafından korunmalıdır.
*   Kod tabanında TypeScript uyarıları ve çalışma zamanı hataları (özellikle `React.lazy` ile ilgili olanlar) giderilmiş olmalıdır.
*   Tüm UI elementleri responsive olmalı ve farklı ekran boyutlarında düzgün görüntülenmelidir.
*   Kod kalitesi standartlarına uyulmalı, okunabilir ve sürdürülebilir kod yazılmalıdır.
*   Yeni eklenen özellikler için gerekli testler (unit, integration) yazılmış olmalıdır (henüz kodlanmadı, plan aşamasında).
