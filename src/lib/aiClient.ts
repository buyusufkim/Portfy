import { supabase } from './supabase'; // Auth token'ı almak için

export interface GenerateContentConfig {
  featureKey?: string;
  responseSchema?: Record<string, unknown>;
  responseMimeType?: string;
  systemInstruction?: string | { role: string; parts: { text: string }[] };
}

type ContentPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

type GenerateContentItem = {
  role: "user" | "model";
  parts: ContentPart[];
};

export type GenerateContentInput = string | GenerateContentItem[];

export const generateContent = async <T = unknown>(model: string, contents: GenerateContentInput, config?: GenerateContentConfig): Promise<T> => {
  try {
    // Kullanıcının oturum token'ını al (Backend'deki authenticate middleware'i için şart)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    const formattedContents = typeof contents === 'string' 
      ? [{ role: 'user', parts: [{ text: contents }] }]
      : contents;

    // İstek artık doğrudan Google'a değil, kendi güvenli backend'ine gidiyor
    const apiUrl = window.location.origin + '/api/ai/generate';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        model: model,
        contents: formattedContents,
        featureKey: config?.featureKey
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Sunucu hatası");
    }

    // Backend zaten JSON parse edip 'data' içinde gönderiyor
    return result.data; 

  } catch (error: unknown) {
    console.error("Güvenli AI Çağrı Hatası:", error);
    throw error instanceof Error ? error : new Error("AI çağrısı başarısız oldu.");
  }
};