import {
  GamifiedTask,
  Property,
  Task,
  PersonalTask,
  LeadAlert,
  CampaignTask,
} from "../types";
import { LucideIcon, AlertCircle, Ghost, Sparkles, ClipboardList, Star, UserCheck, Target } from "lucide-react";

type BaseActionItem = {
  id: string;
  title: string;
  subtitle: string;
  desc?: string;
  icon: LucideIcon;
  colorClass: string;
  ringClass: string;
};

export type TopActionItem = BaseActionItem &
  (
    | { type: "alert"; originalItem: LeadAlert }
    | { type: "bolgem_followup"; originalItem: Task }
    | { type: "smart_rec"; originalItem: Property }
    | { type: "drip"; originalItem: Task }
    | { type: "gamified"; originalItem: GamifiedTask }
    | { type: "daily"; originalItem: Task }
    | { type: "personal"; originalItem: PersonalTask }
    | { type: "campaign"; originalItem: CampaignTask }
  );

export const formatTime = (dateStr?: string) => {
  if (!dateStr) return "Bugün";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Bugün";
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "Bugün";
  }
};

export const normalizeLeadName = (name?: string) => {
  if (!name) return "";
  return name.trim().toLowerCase().replace(/\s+/g, " ");
};

export const leadAlertDescriptions: Record<string, string> = {
  stale_7d: "7 gündür temas yok",
  stale_14d: "14 gündür temas yok",
  no_contact_7d: "7 gündür iletişim kurulmadı",
  no_contact: "Temas bekliyor",
  hot_lead: "Sıcak aday, bugün temas et",
  hot_48h_silence: "Sıcak aday: 48 saattir sessizlik!",
  stale_3d: "3 gündür temas yok",
  followup_due: "Takip zamanı geldi",
  followup_overdue: "Takip gecikmiş",
  missing_phone: "Telefon bilgisi eksik",
  missing_region: "Bölge bilgisi eksik",
  new_lead: "Yeni lead",
  cold_lead: "Soğuk lead, yeniden ısıt",
  warm_lead: "Ilık lead, temas önerilir",
  silent: "Sessiz müşteri"
};

export const getAlertPriority = (typeStr: string) => {
  if (typeStr === 'stale_14d') return 100;
  if (typeStr === 'stale_7d' || typeStr === 'no_contact_7d') return 90;
  if (typeStr === 'stale_3d') return 80;
  if (typeStr === 'no_contact') return 70;
  if (typeStr === 'silent') return 60;
  if (typeStr.includes('hot')) return 110;
  if (typeStr.includes('followup_overdue')) return 95;
  if (typeStr.includes('followup_due')) return 85;
  return 50;
};

export const getAlertCategory = (typeStr: string) => {
  if (typeStr.includes('stale') || typeStr.includes('no_contact') || typeStr === 'silent') return 'stale';
  if (typeStr.includes('followup')) return 'followup';
  if (typeStr.includes('missing')) return 'missing_info';
  if (typeStr.includes('hot')) return 'hot';
  if (typeStr.includes('new') || typeStr.includes('warm') || typeStr.includes('cold')) return 'state';
  return typeStr;
};

export const isTodayOrOverdue = (taskDate: string | undefined, todayISO: string) => {
  if (!taskDate) return true; // Without date falls to today
  return taskDate.split("T")[0] <= todayISO;
};

export function getDedupedAlerts(leadAlerts: LeadAlert[]) {
  return Object.values((leadAlerts || []).reduce((acc: Record<string, LeadAlert>, alert) => {
    const leadKey = alert.lead_id || alert.lead?.id || normalizeLeadName(alert.lead?.name) || alert.id;
    const key = `${leadKey}-${getAlertCategory(alert.alert_type)}`;
    if (!acc[key]) {
      acc[key] = alert;
    } else {
      const existingScore = getAlertPriority(acc[key].alert_type);
      const newScore = getAlertPriority(alert.alert_type);
      if (newScore > existingScore) {
         acc[key] = alert;
      } else if (newScore === existingScore) {
         if (new Date(alert.triggered_at || 0) > new Date(acc[key].triggered_at || 0)) {
             acc[key] = alert;
         }
      }
    }
    return acc;
  }, {})).sort((a: LeadAlert, b: LeadAlert) => getAlertPriority(b.alert_type) - getAlertPriority(a.alert_type));
}
