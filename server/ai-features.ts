import { GenerateContentConfig } from "@google/genai";

export interface AIFeatureConfig {
  allowedModels: string[];
  defaultModel: string;
  maxInputChars: number;
  responseSchema?: Record<string, unknown>;
  systemInstruction?: string;
  allowClientSystemInstruction?: boolean;
  allowClientResponseSchema?: boolean;
}

const COMMON_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview",
  "gemini-1.5-flash-latest"
];

const AI_COACH_SCHEMA = {
  type: "object",
  properties: {
    insight: {
      type: "object",
      properties: {
        coachComment: { type: "string", description: "Danışman için kısa, net ve özel koçluk yorumu" },
        mainFocus: {
          type: "array",
          description: "Maksimum 3 adet ana odak noktası",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              reason: { type: "string" },
              targetRoute: { type: "string", description: "Yönlendirme rotası (Örn: /tasks, /crm, /portfolio)" }
            },
            required: ["title", "reason", "targetRoute"]
          }
        },
        suggestedActions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              targetRoute: { type: "string", description: "Yönlendirme rotası (Örn: /tasks, /crm, /portfolio)" },
              priority: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["title", "description", "targetRoute", "priority"]
          }
        },
        emptyReason: { type: "string", nullable: true, description: "Eğer veri yetersizse kullanıcıya gösterilecek açıklama" }
      },
      required: ["coachComment", "mainFocus", "suggestedActions"]
    },
    generated_at: { type: "string" }
  },
  required: ["insight", "generated_at"]
};

const WHATSAPP_ANALYSIS_SCHEMA = {
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

const WHATSAPP_LEAD_EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    phone: { type: "string" },
    type: { type: "string", enum: ['Alıcı', 'Satıcı', 'Kiracı', 'Kiralayan'] },
    status: { type: "string", enum: ['Aday', 'Sıcak', 'Pasif'] },
    notes: { type: "string" }
  },
  required: ["name", "phone", "type", "status", "notes"]
};

export const AI_FEATURE_REGISTRY: Record<string, AIFeatureConfig> = {
  ai_coach: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 15000,
    responseSchema: AI_COACH_SCHEMA,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  },
  dashboard_coach: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 5000,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  },
  whatsapp_analysis: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 10000,
    responseSchema: WHATSAPP_ANALYSIS_SCHEMA,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  },
  whatsapp_lead_extract: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 10000,
    responseSchema: WHATSAPP_LEAD_EXTRACT_SCHEMA,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  },
  business_card_parse: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 100000,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  },
  property_valuation: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 20000,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  },
  generic_safe_json: {
    allowedModels: COMMON_MODELS,
    defaultModel: "gemini-2.0-flash",
    maxInputChars: 100000,
    allowClientSystemInstruction: false,
    allowClientResponseSchema: false,
  }
};

export const getFeatureConfig = (key?: string): AIFeatureConfig => {
  if (!key) {
    throw new Error("AI featureKey zorunludur.");
  }
  const feature = AI_FEATURE_REGISTRY[key];
  if (!feature) {
    throw new Error(`Bilinmeyen AI Feature Key: ${key}`);
  }
  return feature;
};
