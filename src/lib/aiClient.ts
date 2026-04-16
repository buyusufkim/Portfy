import { supabase } from './supabase'; // Auth token'ı almak için

export const generateContent = async (model: string, contents: any, config?: any) => {
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
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        model: model,
        contents: formattedContents,
        responseSchema: config?.responseSchema, // Gerekirse JSON şemasını gönder
        systemInstruction: config?.systemInstruction
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Sunucu hatası");
    }

    // Backend zaten JSON parse edip 'data' içinde gönderiyor
    return result.data; 

  } catch (error: any) {
    console.error("Güvenli AI Çağrı Hatası:", error);
    throw error;
  }
};