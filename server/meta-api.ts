// server/meta-api.ts
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin yetkisine sahip Supabase client'ı (Doğrudan veritabanına yazmak için)
const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Meta'nın Webhook'umuzu doğruladığı (Verification) uç nokta
export const handleMetaWebhookGet = (req: any, res: any) => {
  // Bu token'ı daha sonra Meta Developer Portal'a gireceğiz
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "portfy_secure_token_2026";
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Meta Webhook] Doğrulama Başarılı!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

// Instagram'dan gelen Yorumları ve Mesajları İşleyen uç nokta
export const handleMetaWebhookPost = async (req: any, res: any) => {
  const body = req.body;

  if (body.object === 'instagram') {
    // Meta'nın sürekli aynı veriyi göndermesini engellemek için anında 200 OK dönüyoruz
    res.status(200).send('EVENT_RECEIVED');

    try {
      for (const entry of body.entry) {
        // Hangi Instagram hesabından geldiğini tutar (İleride çoklu kullanıcı için eşleştireceğiz)
        const instagramAccountId = entry.id; 

        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const commentText = change.value.text;
            const username = change.value.from.username;
            const mediaId = change.value.media.id;

            console.log(`[Yeni Yorum] @${username}: "${commentText}"`);

            if (ai) {
              // 1. Adım: Gemini ile Niyet Okuma (Intent Parsing)
              const prompt = `
                Sen bir gayrimenkul satış asistanısın. Şu Instagram yorumunu analiz et: "${commentText}". 
                Bu kişi bir portföy hakkında bilgi almak, fiyat sormak veya gayrimenkul satın almak/kiralamak istiyor mu?
                Sadece şu JSON formatında dön: 
                {"isLead": boolean, "intent": "Niyetin 3 kelimelik özeti", "estimated_budget": "Eğer bahsettiyse bütçe, yoksa null"}
              `;

              const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });

              let cleanJson = response.text || "{}";
              cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
              const result = JSON.parse(cleanJson);

              // 2. Adım: Eğer müşteri potansiyeli (Lead) taşıyorsa veritabanına kaydet
              if (result.isLead) {
                console.log(`[🔥 SICAK LEAD YAKALANDI] @${username} - Niyet: ${result.intent}`);

                // Not: Şimdilik sistemi test etmek için ilk bulduğu admin veya sisteme kayıtlı ilk kullanıcının id'sini alıyoruz.
                // Gerçek senaryoda instagramAccountId'yi profil tablosundaki bir sütunla eşleştireceğiz.
                const { data: firstUser } = await supabaseAdmin.from('profiles').select('id').limit(1).single();

                if (firstUser) {
                  await supabaseAdmin.from('leads').insert({
                    user_id: firstUser.id,
                    name: `@${username} (Instagram)`,
                    phone: '', // DM yoluyla istenecek
                    status: 'Sıcak',
                    type: 'Alıcı',
                    notes: `Sistem Tarafından Yakalandı.\nYorum: "${commentText}"\nNiyet: ${result.intent}\nMedya ID: ${mediaId}`,
                  });
                  console.log(`[✅ Kayıt Başarılı] @${username} CRM'e eklendi.`);
                  
                  // 3. Adım: Otomatik DM ve Yorum Yanıtlama API istekleri buraya eklenecek
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[Meta Webhook Hatası]:", err);
    }
  } else {
    res.sendStatus(404);
  }
};