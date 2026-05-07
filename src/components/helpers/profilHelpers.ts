import { UserProfile, BrokerAccount } from "../../types";

export interface ProfileCompletionFormData {
  display_name?: string | null;
  phone?: string | null;
  bio?: string | null;
  city?: string | null;
  district?: string | null;
  company_name?: string | null;
  title?: string | null;
  expertise_areas?: string[] | null;
}

export function calculateProfileCompletionScore(formData: ProfileCompletionFormData, profile: Pick<UserProfile, 'region'> | null, brokerAccount: Pick<BrokerAccount, 'id'> | null) {
  let score = 0;
  if (formData.display_name) score += 10;
  if (formData.phone) score += 10;
  if (formData.bio) score += 10;
  if (formData.city || formData.district) score += 10;
  if (profile?.region?.city || profile?.region?.district) score += 15;
  if (formData.company_name || formData.title) score += 10;
  if (formData.expertise_areas && formData.expertise_areas.length > 0) score += 15;
  if (brokerAccount) score += 20;

  const clampedScore = Math.min(score, 100);

  let scoreMessage = "Profilini tamamla, Portfy seni daha iyi yönlendirsin.";
  if (clampedScore >= 80) scoreMessage = "Profil güçlü görünüyor.";
  else if (clampedScore >= 50) scoreMessage = "İyi gidiyorsun, birkaç bilgi daha ekle.";

  return { clampedScore, scoreMessage };
}
