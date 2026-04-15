import { VoiceParseResult } from '../types';
import { generateContent } from '../lib/aiClient';

export const voiceService = {
  parseVoiceCommand: async (text: string): Promise<VoiceParseResult> => {
    try {
      const prompt = `Sen bir gayrimenkul danışmanı asistanısın. Aşağıdaki sesli komut metnini analiz et ve JSON formatında yapılandırılmış veriye dönüştür.
      
      Metin: "${text}"
      
      Kurallar:
      1. Niyet (intent) şunlardan biri olmalı: 'lead' (yeni müşteri), 'task' (görev/hatırlatıcı), 'note' (saha notu) veya 'unknown'.
      2. Eğer görev sosyal medya ile ilgiliyse (paylaşım, reels, story vb.), bunu açıklama kısmında belirt.
      3. İsim, telefon, bütçe (sayı olarak), lokasyon, tarih (ISO formatında) ve açıklama gibi verileri çıkar.
      4. Çıkaramadığın verileri boş bırak.
      
      JSON Şeması:
      {
        "intent": "lead" | "task" | "note" | "unknown",
        "confidence": 0.0 - 1.0,
        "extracted_data": {
          "name": "string",
          "phone": "string",
          "budget": number,
          "location": "string",
          "due_date": "ISO date string",
          "description": "string",
          "task_type": "Arama" | "Randevu" | "Saha" | "Sosyal Medya"
        }
      }
      `;

      const response = await generateContent(
        'gemini-flash-latest',
        prompt,
        {
          responseMimeType: 'application/json',
        }
      );

      const result = JSON.parse(response.text || '{}');
      return {
        original_text: text,
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0.5,
        extracted_data: result.extracted_data || {}
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        original_text: text,
        intent: 'unknown',
        confidence: 0,
        extracted_data: { description: text }
      };
    }
  }
};
