import { VoiceParseResult } from '../types';
import { generateContent } from '../lib/aiClient';

export const voiceService = {
  parseVoiceCommand: async (text: string): Promise<VoiceParseResult> => {
    try {
      const prompt = `Sen bir gayrimenkul danışmanı asistanısın. Aşağıdaki serbest metni/ses kaydını analiz et ve JSON formatında yapılandır.
      Kullanıcı tek bir cümlede hem müşteri eklemek, hem de ona bir görev(hatırlatıcı) atamak istiyor olabilir (Örn: "Ahmet Bey'i ekle, yarın arayacağım"). Bu durumda intent'i 'composite' yap ve actions dizisini doldur. Müşterinin spesifik bütçesi/ilgisi nota da dahil edilebilir.
      
      Metin: "${text}"
      
      Kurallar:
      1. Niyet (intent) şunlardan biri olmalı: 'lead' (sadece müşteri), 'task' (sadece görev), 'note' (sadece not), 'composite' (birden fazla eylem barındırıyorsa), veya 'unknown'.
      2. Müşteri (lead) çıkarılırken varsa isim, telefon, bütçe (budget), bölge (district) ve notlar(notes) çıkarılmalı.
      3. Görev (task) çıkarılırken, tarih (ISO formatında) ve başlık (title) çıkarılmalı. Verilen "yarın", "haftaya" formlarını geçerli ISO 8601 tarih formlarına (Örn: Yarınsa şimdiki tarihten +1 gün) çevir.
      4. Çıkaramadığın verileri boş bırak.
      5. "actions" array'i, eklenecek somut aksiyonları temsil eder. composite, lead, task, note fark etmeksizin ilgili aksiyonu buraya ekle.
      
      JSON Şeması:
      {
        "intent": "lead" | "task" | "note" | "composite" | "unknown",
        "confidence": 0.0,
        "extracted_data": {
          "name": "string",
          "phone": "string",
          "budget": 0,
          "location": "string",
          "due_date": "string",
          "description": "string",
          "task_type": "Arama" | "Randevu" | "Saha" | "Sosyal Medya"
        },
        "actions": [
          {
            "type": "lead",
            "payload": { "name": "...", "phone": "...", "budget": 0, "district": "...", "notes": "..." },
            "explanation": "Ahmet Bey isimli müşteri oluşturuldu"
          },
          {
            "type": "task",
            "payload": { "title": "...", "time": "2023-11-20T10:00:00.000Z", "type": "Arama" },
            "explanation": "Yarın için arama görevi eklendi"
          }
        ]
      }`;

      const result: any = await generateContent(
        'gemini-2.0-flash',
        prompt,
        {
          responseMimeType: 'application/json',
        }
      );

      return {
        original_text: text,
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0.5,
        extracted_data: result.extracted_data || {},
        actions: result.actions || []
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        original_text: text,
        intent: 'unknown',
        confidence: 0,
        extracted_data: { description: text },
        actions: []
      };
    }
  }
};