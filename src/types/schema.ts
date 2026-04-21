// Portfy Schema Definition v1.1
export type UserTier = 'free' | 'pro' | 'elite';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  tier: UserTier;
  ai_tokens_used: number; // Eksik olan field eklendi
  region_id?: string;
  created_at: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  price_numeric: number;
  price_text: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  stripe_price_id?: string;
  badge?: string;
}

export interface SystemSettings {
  key: string;
  value: any;
  description?: string;
}

export interface UserUsageLimit {
  user_id: string;
  feature_name: string;
  current_usage: number;
  max_limit: number;
  reset_at: string;
}

export interface TaskTemplate {
  id: string;
  category: 'listing' | 'sale' | 'prospecting' | 'ritual';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  auto_verify?: boolean;
}

// Global API Response Wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  usage?: {
    totalTokens: number;
  };
}