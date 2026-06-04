export type PublicPlanKey = 'entrepreneur' | 'master';

export type SubscriptionPackageRow = {
  id: string;
  name: string;
  tier: string;
  price_numeric: number;
  price_text: string;
  interval?: string | null;
  badge?: string | null;
  duration_months?: number | null;
  is_active?: boolean | null;
};

export const PUBLIC_PLANS = [
  {
    key: 'entrepreneur',
    name: 'Girişimci',
    badge: 'Başlangıç',
    description: 'Portfy’ye başlamak ve temel saha disiplinini kurmak için.',
    highlights: [
      'Temel CRM kullanımı',
      'Temel portföy yönetimi',
      'Günlük akış ve görev takibi',
      'Sınırlı AI kullanım hakkı'
    ],
    cta: 'Ücretsiz Başla'
  },
  {
    key: 'master',
    name: 'Master',
    badge: 'Önerilen',
    description: 'Aktif danışmanlar için AI destekli satış, takip ve saha işletim sistemi.',
    highlights: [
      '90 Gün Kampı',
      'AI Koç',
      'Smart Match',
      'Gelişmiş CRM takipleri',
      'Bölgem saha hafızası',
      'Portföy AI pazarlama araçları'
    ],
    cta: 'Master’a Geç'
  }
] as const;

export const normalizePlanKey = (value: string) => {
  if (value === 'free') return 'entrepreneur';
  if (value === 'pro' || value === 'master' || value === 'elite') return 'master';
  return value;
};

