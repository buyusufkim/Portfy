import { Lead, Property, Task, MissedOpportunity, UserProfile } from '../types';

export type AiCoachTone = "professional" | "friendly" | "motivational" | "direct";

export const normalizeAiCoachTone = (value?: string | null): AiCoachTone => {
  switch (value) {
    case "friendly":
    case "motive_edici":
      return "friendly";
    case "motivational":
      return "motivational";
    case "direct":
    case "sert_koc":
      return "direct";
    case "professional":
    case "net":
    default:
      return "professional";
  }
};

export const getAiCoachToneInstruction = (tone: AiCoachTone): string => {
  switch (tone) {
    case "friendly":
      return "AI Koç Tonu: Dostça, sıcak, destekleyici ve samimi bir dil kullan. Fakat profesyonelliği koru, aşırı emoji kullanma.";
    case "motivational":
      return "AI Koç Tonu: Enerji veren, fazlasıyla motive edici, moral yükselten ve pozitif bir dil kullan.";
    case "direct":
      return "AI Koç Tonu: Direkt, kesin, sonuç odaklı ve lafı dolandırmayan bir dil kullan. Zayıf noktaları net bir şekilde yüzleşecek kıvamda belirt.";
    case "professional":
    default:
      return "AI Koç Tonu: Net, kurumsal, profesyonel, ölçülü ve mesafeli bir dil kullan. Gereksiz samimiyetten kaçın.";
  }
};

export const AI_COACH_SCHEMA = {
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

export const buildCoachPrompt = (data: {
  profile: UserProfile | null;
  leads: Lead[];
  properties: Property[];
  tasks: Task[];
  missedOpportunities: MissedOpportunity[];
  requestType?: string;
  customMessage?: string;
}) => {
  const strippedLeads = data.leads
    .filter(l => l.status === 'Sıcak')
    .slice(0, 5)
    .map(l => ({ isim: l.name, tip: l.type, notlar: l.notes }));

  const strippedProperties = data.properties
    .slice(0, 5)
    .map(p => ({ baslik: p.title, fiyat: p.price, durum: p.status, tip: p.type }));

  const strippedTasks = data.tasks
    .filter(t => !t.completed)
    .slice(0, 5)
    .map(t => ({ baslik: t.title, zaman: t.time }));

  const strippedOpps = data.missedOpportunities
    .slice(0, 3)
    .map(m => ({ detay: m.description, neden: m.reason }));
    
  const tone = normalizeAiCoachTone(data.profile?.ai_coach_tone);
  const toneInstruction = getAiCoachToneInstruction(tone);

  let activeContext = "Danışmanın genel durumunu analiz et ve gün için stratejik bir plan çıkar.";
  if (data.requestType === "analyze") activeContext = "Danışmanın tüm verilerini derinlemesine analiz et ve genel bir özet/durum değerlendirmesi çıkar.";
  if (data.requestType === "priorities") activeContext = "Danışmanın BUGÜN yapması gereken en acil 3 önceliği belirle.";
  if (data.requestType === "risks") activeContext = "Geciken görevleri veya kaybedilmek üzere olan müşterileri (riskleri) tespit et ve uyar.";
  if (data.requestType === "region") activeContext = "Danışmanın bölgesine veya portföylerine odaklanarak saha çalışması veya bölge bölgesi için strateji öner.";
  if (data.requestType === "portfolio") activeContext = "Mevcut portföyleri ve sıcak müşterileri eşleştirme fırsatları ara veya portföy pazarlama fırsatlarını çıkar.";
  if (data.customMessage) activeContext = `Kullanıcının özel mesajı/sorusu: "${data.customMessage}". Öncelikle bu soruya ve isteğe göre planı şekillendir.`;

  return `
    Sen Portfy uygulamasının AI Koçusun. Bir gayrimenkul danışmanına rehberlik ediyorsun.
    Aşağıdaki verilere dayanarak danışman için stratejik bir günlük plan üret.
    
    Aksiyon Context / İstem: ${activeContext}
    
    Kullanıcı Profili: ${JSON.stringify(profileSummary(data.profile))}
    Sıcak Müşteriler: ${JSON.stringify(strippedLeads)}
    Portföyler: ${JSON.stringify(strippedProperties)}
    Bekleyen Görevler: ${JSON.stringify(strippedTasks)}
    Kaçırılan Fırsatlar: ${JSON.stringify(strippedOpps)}
    
    Kurallar:
    1. Yanıt mutlaka belirlenen JSON şemasına uygun olmalı.
    2. Aksiyonlar net ve yapılabilir olmalı.
    3. Hangi rotaya gidilmesi gerektiği (targetRoute) doğru belirtilmeli (Örn: görevse /tasks, müşteriyse /crm, portföyse /portfolio).
    4. ${toneInstruction}
  `;
};

const profileSummary = (p?: UserProfile | null) => ({
  name: p?.display_name,
  level: p?.broker_level,
  xp: p?.total_xp,
  streak: p?.current_streak,
  region: p?.region
});