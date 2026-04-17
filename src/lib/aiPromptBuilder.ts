import { Lead, Property, Task, MissedOpportunity } from '../types';

export const AI_COACH_SCHEMA = {
  type: "object",
  properties: {
    insight: {
      type: "object",
      properties: {
        score: { type: "number", description: "0-100 arası genel performans skoru" },
        briefing: { type: "string", description: "Günün kısa özeti ve motivasyonel mesaj" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["call", "visit", "followup", "update", "rescue", "social"] },
              title: { type: "string" },
              description: { type: "string", description: "Aksiyonun detaylı açıklaması (Örn: Reels videosu için senaryo önerisi)" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              target_id: { type: "string" },
              target_name: { type: "string" },
              points: { type: "number" }
            },
            required: ["id", "type", "title", "description", "priority", "points"]
          }
        },
        warnings: {
          type: "array",
          items: { type: "string" }
        },
        performance_evaluation: { type: "string" },
        is_rescue_mode_recommended: { type: "boolean" }
      },
      required: ["score", "briefing", "actions", "warnings", "performance_evaluation", "is_rescue_mode_recommended"]
    },
    generated_at: { type: "string" }
  },
  required: ["insight", "generated_at"]
};

export const buildCoachPrompt = (data: {
  profile: any;
  leads: Lead[];
  properties: Property[];
  tasks: Task[];
  missedOpportunities: MissedOpportunity[];
}) => {
  // Gereksiz çöplerden arındırılmış veri setimiz
  const strippedLeads = data.leads
    .filter(l => l.status === 'Sıcak')
    .slice(0, 5)
    .map(l => ({ isim: l.name, tip: l.type, not: l.notes }));

  const strippedProperties = data.properties
    .slice(0, 5)
    .map(p => ({ baslik: p.title, fiyat: p.price, durum: p.status, tip: p.type }));

  const strippedTasks = data.tasks
    .filter(t => !t.completed)
    .slice(0, 5)
    .map(t => ({ baslik: t.title, zaman: t.time }));

  const strippedOpps = data.missedOpportunities
    .slice(0, 3)
    .map(m => ({ detay: m.description, tip: m.type }));

  return `
    Sen Portfy uygulamasının AI Koçusun. Bir gayrimenkul danışmanına (Broker) rehberlik ediyorsun.
    Aşağıdaki verilere dayanarak danışman için stratejik bir günlük plan ve analiz üret.
    
    Kullanıcı Profili: ${JSON.stringify(profileSummary(data.profile))}
    Sıcak Müşteriler: ${JSON.stringify(strippedLeads)}
    Portföyler: ${JSON.stringify(strippedProperties)}
    Bekleyen Görevler: ${JSON.stringify(strippedTasks)}
    Kaçırılan Fırsatlar: ${JSON.stringify(strippedOpps)}
    
    Kurallar:
    1. Yanıt mutlaka belirlenen JSON şemasına uygun olmalı.
    2. Aksiyonlar (actions) net ve yapılabilir olmalı (Örn: "Ahmet Bey'i ara", "X portföyünün fiyatını güncelle").
    3. Sosyal medya stratejisi konusunda mutlaka en az bir yaratıcı tavsiye ver.
    4. Eğer performans düşükse (görev tamamlama oranı < %30) rescue mode öner.
    5. Dil profesyonel, sert, yönlendirici ve aksiyon odaklı olmalı.
    6. BÖLGE UZMANLIĞI: Kullanıcının profilindeki bölgeyi (region) dikkate al. Aksiyonlarının veya sosyal medya tavsiyelerinin en az birini doğrudan bu bölgeyi domine etmeye, o bölgedeki pazar payını artırmaya yönelik kurgula.
  `;
};

const profileSummary = (p: any) => ({
  name: p?.display_name,
  level: p?.broker_level,
  xp: p?.total_xp,
  streak: p?.current_streak,
  region: p?.region // Haklıydın, bunu geri ekledik.
});
