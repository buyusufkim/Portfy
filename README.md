# Portfy: AI-Driven Real Estate Operations Engine

Portfy, gayrimenkul danışmanları için geliştirilmiş sıradan bir CRM değil; saha faaliyetlerini, bölge hakimiyetini ve günlük rutinleri optimize eden bir **davranış yönlendirme motorudur.**

## 🛠 Teknik Mimari & Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons.
- **State Management:** TanStack Query (React Query) v5.
- **Backend:** Node.js, Express.js (AI Engine & API Gateway).
- **Database & Auth:** Supabase (PostgreSQL + RLS).
- **AI Core:** Google Gemini 1.5 Pro / Flash (ai-api integration).
- **Deployment:** Vercel (Frontend), Railway/Render (Backend).

## 🏗 Ürün Omurgası (Core Modules)

* **Rescue Mode:** Satış baskısı altındaki danışman için acil aksiyon planlayıcı.
* **Daily Rituals:** Sabah rutini ve saha odaklı görev dağıtımı.
* **Region Mastery (Bölgem):** Verimlilik odaklı bölge analizi ve rakip takibi.
* **Coach AI:** Gemini tabanlı, profesyonel emlak koçu ve itiraz karşılama asistanı.
* **Public Presentation:** Portföylerin müşteri tarafındaki dijital yüzü.

## ⚠️ Mevcut Geliştirme Odakları (Refactor Roadmap)
- [ ] **Schema Drift Fix:** SQL şeması ile uygulama modellerinin senkronizasyonu.
- [ ] **Type Safety:** `any` kullanımlarının temizlenmesi ve Interface tanımlarının katılaştırılması.
- [ ] **Token Economy:** AI kullanım limitlerinin fallback'lerden çıkarılıp gerçek zamanlı DB entegrasyonuna taşınması.
- [ ] **Module De-bloating:** 500+ satırlık büyük componentlerin atomik parçalara bölünmesi.
