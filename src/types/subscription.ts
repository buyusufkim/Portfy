import type { SubscriptionTier } from '../shared/subscriptionRules';

export { SubscriptionTier };

export type FeatureKey = 
  | 'ai_coach' 
  | 'whatsapp_analysis' 
  | 'advanced_stats' 
  | 'unlimited_leads' 
  | 'unlimited_properties' 
  | 'team_collaboration' 
  | 'custom_branding' 
  | 'api_access';

export interface FeatureConfig {
  minTier: SubscriptionTier;
  label: string;
  description: string;
}
