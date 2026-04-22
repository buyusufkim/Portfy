// server/meta-api.ts
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const getSupabaseAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn("[Meta API] Uyarı: Supabase URL veya Key eksik!");
    return null;
  }
  return createClient(url, key);
};

// Instagram API: Yoruma herkese açık (Public) yanıt verme
const sendPublicReply = async (commentId: string, message: string) => {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return console.warn("[Meta API] META_ACCESS_TOKEN eksik, yanıtlanamadı.");
  
  try {
    await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ message })
    });
    console.log(`[Meta API] Yoruma public yanıt verildi!`);
  } catch (error) {
    console.error("[Meta API] Public Reply Hatası:", error);
  }
};

// Instagram API: Yorum yapan kişiye gizli DM (Direct Message) atma
const sendPrivateDM = async (commentId: string, message: string) => {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return console.warn("[Meta API] META_ACCESS_TOKEN eksik, DM atılamadı.");
  
  try {
    await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message }
      })
    });
    console.log(`[Meta API] Kullanıcıya gizli DM başarıyla atıldı!`);
  } catch (error) {
    console.error("[Meta API] Private DM Hatası:", error);
  }
};

export const handleMetaWebhookGet = (req: any, res: any) => {
  try {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "portfy_secure_token_2026";
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Token uyusmuyor');
      }
    } else {
      res.status(400).send('Parametreler eksik');
    }
  } catch (error) {
    res.status(500).send('Sunucu Hatasi');
  }
};

export const handleMetaWebhookPost = async (req: any, res: any) => {
  const body = req.body;

  if (body.object === 'instagram') {
    res.status(200).send('EVENT_RECEIVED'); // Meta'ya anında OK dönerek sistemin kilitlenmesini önlüyoruz

    try {
      const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
      const supabaseAdmin = getSupabaseAdmin();

      for (const entry of body.entry) {
        const pageId = entry.id; // Senin kendi Instagram hesabının ID'si

        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const commentText = change.value.text;
            const username = change.value.from.username;
            const senderId = change.value.from.id;
            const commentId = change.value.id; 

            // Sistemin kendi kendine attığı yanıtlara (DM gönderdim vs) cevap vermesini engelliyoruz
            if (senderId === pageId) continue;

            if (ai && supabaseAdmin) {
              const prompt = `Sen üst düzey bir emlak satış uzmanısın. Instagram'da gelen şu yorumu analiz et: "${commentText}". 
              Müşteri portföy hakkında fiyat, konum, detay öğrenmek veya iletişim kurmak mı istiyor? 
              Eğer bu sadece bir tebrik (Örn: "Hayırlı işler", "Harika ev") veya alakasız bir yorumsa isLead: false yap. 
              Eğer bilgi almak istiyorsa (Örn: "Fiyat nedir?", "Konum neresi?", "Kaç para") isLead: true yap. 
              Sadece geçerli JSON dön: {"isLead": boolean, "intent": "Niyetin 3 kelimelik özeti"}`;

              const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });

              let cleanJson = response.text || "{}";
              cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
              let result = { isLead: false, intent: "" };
              try { result = JSON.parse(cleanJson); } catch (e) { console.error("Parse Hatası", e); }

              if (result.isLead) {
                // 1. LEAD EKLEME (Sıfır Temaslı CRM)
                const { data: firstUser } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
                if (firstUser) {
                  await supabaseAdmin.from('leads').insert({
                    user_id: firstUser.id,
                    name: `@${username} (Instagram)`,
                    status: 'Sıcak',
                    type: 'Alıcı',
                    notes: `Sistem Yakaladı.\nYorum: "${commentText}"\nNiyet: ${result.intent}`,
                  });
                }

                // 2. YORUMA HERKESE AÇIK YANIT
                await sendPublicReply(commentId, `Harika bir tercih @${username}! 🏡 Detaylı sunum dosyasını ve fiyat bilgisini DM kutunuza gönderdim. 🤝`);

                // 3. MÜŞTERİYE ÖZEL DM VE SUNUM LİNKİ GÖNDERİMİ
                const dmMessage = `Merhaba @${username}! 🎉\n\nİlgilendiğiniz portföyün tüm detaylarına, konumuna ve yüksek çözünürlüklü fotoğraflarına Portfy üzerinden ulaşabilirsiniz:\n\n👉 https://portfy.tr/p/demo-portfoy\n\nDetaylı bilgi almak isterseniz veya yerinde görmek isterseniz, bu mesaja yanıt vermeniz yeterli!`;
                await sendPrivateDM(commentId, dmMessage);
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