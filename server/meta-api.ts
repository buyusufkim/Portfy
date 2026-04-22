// server/meta-api.ts
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// Güvenli Supabase Bağlantısı (Şifre yoksa sunucuyu çökertmez)
const getSupabaseAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn("[Meta API] Uyarı: Supabase URL veya Key eksik!");
    return null;
  }
  return createClient(url, key);
};

export const handleMetaWebhookGet = (req: any, res: any) => {
  try {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "portfy_secure_token_2026";
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Meta Webhook] Doğrulama Başarılı!');
        // Sadece challenge kodunu düz metin olarak dönüyoruz (Meta'nın tam olarak istediği format)
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Token uyusmuyor');
      }
    } else {
      res.status(400).send('Parametreler eksik');
    }
  } catch (error) {
    console.error("Webhook Get Hatası:", error);
    res.status(500).send('Sunucu Hatasi');
  }
};

export const handleMetaWebhookPost = async (req: any, res: any) => {
  const body = req.body;

  if (body.object === 'instagram') {
    res.status(200).send('EVENT_RECEIVED'); // Meta'ya anında OK dön

    try {
      const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
      const supabaseAdmin = getSupabaseAdmin();

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const commentText = change.value.text;
            const username = change.value.from.username;
            
            console.log(`[Yeni Yorum] @${username}: "${commentText}"`);

            if (ai && supabaseAdmin) {
              const prompt = `Sen bir emlak asistanısın. Şu yorumu analiz et: "${commentText}". Müşteri portföy hakkında bilgi mi almak istiyor? Dönüş: {"isLead": boolean, "intent": "Niyet özeti"}`;

              const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });

              let cleanJson = response.text || "{}";
              cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
              const result = JSON.parse(cleanJson);

              if (result.isLead) {
                const { data: firstUser } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
                if (firstUser) {
                  await supabaseAdmin.from('leads').insert({
                    user_id: firstUser.id,
                    name: `@${username} (Instagram)`,
                    status: 'Sıcak',
                    type: 'Alıcı',
                    notes: `Sistem Tarafından Yakalandı.\nYorum: "${commentText}"\nNiyet: ${result.intent}`,
                  });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[Meta Webhook POST Hatası]:", err);
    }
  } else {
    res.sendStatus(404);
  }
};