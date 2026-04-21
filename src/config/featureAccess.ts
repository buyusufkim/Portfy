import { SubscriptionTier, FeatureKey, FeatureConfig } from '../types/subscription';

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  trial: 1,
  pro: 1,
  elite: 2,
  master: 3
};

export const FEATURE_ACCESS_CONFIG: Record<FeatureKey, FeatureConfig> = {
  ai_coach: {
    minTier: 'pro',
    label: 'AI Koç',
    description: 'Günlük verilerinizi analiz eden ve stratejik öneriler sunan yapay zeka asistanı.'
  },
  whatsapp_analysis: {
    minTier: 'pro',
    label: 'WhatsApp Analizi',
    description: 'WhatsApp konuşmalarını analiz edip CRM verisine dönüştüren akıllı modül.'
  },
  advanced_stats: {
    minTier: 'pro',
    label: 'Gelişmiş İstatistikler',
    description: 'Satış performansınızı ve portföy sağlığınızı detaylı grafiklerle takip edin.'
  },
  unlimited_leads: {
    minTier: 'elite',
    label: 'Sınırsız Lead',
    description: 'Müşteri sayısında herhangi bir kısıtlama olmadan çalışın.'
  },
  unlimited_properties: {
    minTier: 'elite',
    label: 'Sınırsız Portföy',
    description: 'Portföy sayısında herhangi bir kısıtlama olmadan çalışın.'
  },
  team_collaboration: {
    minTier: 'elite',
    label: 'Ekip Çalışması',
    description: 'Diğer danışmanlarla portföy paylaşın ve ortak çalışın.'
  },
  custom_branding: {
    minTier: 'master',
    label: 'Özel Markalama',
    description: 'Uygulama arayüzünü ve çıktıları kendi markanızla özelleştirin.'
  },
  api_access: {
    minTier: 'master',
    label: 'API Erişimi',
    description: 'Portfy verilerinizi diğer yazılımlarınızla entegre edin.'
  }
};
