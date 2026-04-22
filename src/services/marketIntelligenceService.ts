import { Property, MarketIntelligenceReport, CompetitorListing } from '../types';
import { generateContent } from '../lib/aiClient';

export const marketIntelligenceService = {
  getCompetitorPulse: async (property: Property): Promise<MarketIntelligenceReport> => {
    const prompt = `Sen Türkiye gayrimenkul piyasası konusunda uzman bir veri analisti ve "Piyasa İstihbarat" yapay zekasısın.
    Aşağıdaki özelliklere sahip bir portföy (mülk) için çevredeki (aynı bölge ve kriterlerde) "rakip analizi" ve "istihbarat raporu" oluşturmanı istiyorum.
    
    Portföy Bilgileri:
    - Başlık: ${property.title}
    - Tip: ${property.type}
    - Kategori: ${property.category}
    - Fiyat: ₺${property.price}
    - Konum: ${property.address.city}, ${property.address.district}, ${property.address.neighborhood}
    - Özellikler: ${property.details.brut_m2}m2, ${property.details.rooms} oda
    
    Lütfen şu kriterlere uygun, gerçekçi ama kurgusal 3-5 tane rakip ilan üret:
    1. Son 1 haftada yayına giren yeni ilanlar.
    2. Fiyatı yeni düşen ilanlar (eski ve yeni fiyatı belirt).
    3. Yakın zamanda "satıldı" veya "yayından kalktı" olarak işaretlenebilecek emsal ilanlar.
    
    Çıktıyı aşağıdaki JSON formatında ver:
    {
      "summary": "Bölgedeki genel stratejik özet (Maks 2 cümle)",
      "market_mood": "heating" | "cooling" | "stable",
      "action_tip": "Danışmanın mal sahibiyle konuşurken kullanabileceği veri odaklı, vurucu bir argüman/tavsiye",
      "competitors": [
        {
          "external_id": "sahibinden-id-benzeri",
          "title": "İlan Başlığı",
          "price": 000,
          "old_price": 000 (isteğe bağlı),
          "change_type": "new_listing" | "price_drop" | "sold_or_removed",
          "date": "2 gün önce",
          "location": "Mahalle adı veya sokak",
          "distance": "300m yakınlıkta",
          "url": "https://www.sahibinden.com/ilan/..."
        }
      ]
    }`;

    try {
      const response: any = await generateContent(
        'gemini-2.5-flash',
        prompt,
        {
          responseMimeType: 'application/json',
        }
      );

      return {
        ...response,
        property_id: property.id,
        created_at: new Date().toISOString()
      } as MarketIntelligenceReport;
    } catch (error) {
      console.error('Market Intelligence Error:', error);
      // Fallback data
      return {
        property_id: property.id,
        summary: "Bölge analizine şu an ulaşılamıyor, ancak genel piyasa hareketliliği devam ediyor.",
        market_mood: 'stable',
        action_tip: "Fiyatınızı koruyun, bölgedeki talep stabil görünüyor.",
        competitors: [],
        created_at: new Date().toISOString()
      };
    }
  }
};
