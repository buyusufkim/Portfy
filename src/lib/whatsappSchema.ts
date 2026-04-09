export const WHATSAPP_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    analysis: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Konuşmadaki müşterinin adı veya hitap şekli" },
        customer_type: { 
          type: "string", 
          enum: ["Alıcı", "Satıcı", "Kiracı", "Yatırımcı", "Diğer"],
          description: "Müşterinin ana profili"
        },
        interest_level: { 
          type: "string", 
          enum: ["Düşük", "Orta", "Yüksek", "Kritik"],
          description: "Müşterinin gayrimenkul konusundaki ilgi seviyesi"
        },
        hotness_score: { type: "number", description: "0-100 arası sıcaklık skoru" },
        urgency: { type: "string", description: "Müşterinin ne kadar acelesi olduğu" },
        budget_signal: { type: "string", description: "Konuşmadan anlaşılan bütçe veya ödeme gücü sinyalleri" },
        suggested_action: { type: "string", description: "Danışmanın yapması gereken bir sonraki net hamle" },
        follow_up_date: { type: "string", description: "Önerilen takip tarihi (ISO formatında)" },
        confidence_score: { type: "number", description: "Analizin doğruluk güven skoru (0-100)" },
        summary: { type: "string", description: "Konuşmanın 2 cümlelik özeti" },
        extracted_details: {
          type: "object",
          properties: {
            location_preference: { type: "string", description: "İstenen bölge/lokasyon" },
            property_type: { type: "string", description: "İstenen mülk tipi (Daire, Villa vb.)" },
            price_range: { type: "string", description: "Bahsedilen fiyat aralığı" },
            reason_for_moving: { type: "string", description: "Taşınma veya yatırım nedeni" }
          }
        }
      },
      required: [
        "customer_name", "customer_type", "interest_level", "hotness_score", 
        "urgency", "budget_signal", "suggested_action", "follow_up_date", 
        "confidence_score", "summary", "extracted_details"
      ]
    },
    generated_at: { type: "string" }
  },
  required: ["analysis", "generated_at"]
};

export const buildWhatsAppPrompt = (text: string) => {
  return `
    Aşağıdaki WhatsApp konuşmasını analiz et ve bir gayrimenkul danışmanı için CRM verisi üret.
    Müşterinin niyetini, bütçesini ve aciliyetini belirle.
    
    Konuşma Metni:
    """
    ${text}
    """
    
    Kurallar:
    1. Yanıt sadece belirlenen JSON şemasına uygun olmalı.
    2. Eğer müşteri ismi net değilse "Bilinmeyen Müşteri" yaz.
    3. Takip tarihi (followUpDate) bugünden itibaren mantıklı bir gelecek tarih olmalı.
    4. Bütçe sinyali kısmında rakam telaffuz edildiyse mutlaka belirt.
    
    Yanıtı sadece JSON olarak döndür.
  `;
};
