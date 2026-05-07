import { isAdminRole } from '../types';

export const AI_TOKEN_LIMITS = {
  admin: 1000000,
  master: 100000,
  elite: 50000,
  pro: 10000,
  trial: 10000,
  free: 1000,
  none: 1000
};

export type SubscriptionTier = 'admin' | 'master' | 'elite' | 'pro' | 'trial' | 'free' | 'none';

export type ProfileForSubscriptionRules = {
  role?: 'agent' | 'admin' | 'super_admin' | string | null;
  tier?: string | null;
  subscription_type?: string | null;
  subscription_end_date?: string | null;
  ai_token_limit?: number | string | null;
};

export const normalizeTier = (profile: ProfileForSubscriptionRules | null | undefined): string => {
  if (isAdminRole(profile?.role)) return 'admin';
  if (profile?.tier === 'master' || profile?.subscription_type?.includes('master')) return 'master';
  if (profile?.tier === 'elite') return 'elite';
  if (profile?.tier === 'pro' || profile?.subscription_type === '1-month' || profile?.subscription_type === '3-month' || profile?.subscription_type === '6-month' || profile?.subscription_type === '12-month') return 'pro';
  
  if (profile?.tier === 'trial' || profile?.subscription_type === 'trial') return 'trial';

  return 'free';
};

export const isTrialActive = (profile: ProfileForSubscriptionRules | null | undefined, now: Date = new Date()): boolean => {
  const tier = normalizeTier(profile);
  if (tier !== 'trial') return false;

  if (profile?.subscription_end_date) {
    const endDate = new Date(profile.subscription_end_date);
    if (endDate < now) {
      return false; // Trial has expired
    }
  }
  return true;
};

export const isPremiumActive = (profile: ProfileForSubscriptionRules | null | undefined, now: Date = new Date()): boolean => {
  if (isAdminRole(profile?.role)) return true;
  const tier = normalizeTier(profile);
  if (tier === 'admin' || tier === 'master' || tier === 'elite' || tier === 'pro') {
    if (profile?.subscription_end_date) {
      const endDate = new Date(profile.subscription_end_date);
      if (endDate < now) {
        return false;
      }
    }
    return true;
  }
  return isTrialActive(profile, now);
};

export const getDefaultAiTokenLimit = (profile: ProfileForSubscriptionRules | null | undefined, now: Date = new Date()): number => {
  const tier = normalizeTier(profile);
  
  if (tier === 'admin') return AI_TOKEN_LIMITS.admin;
  if (tier === 'master') return AI_TOKEN_LIMITS.master;
  if (tier === 'elite') return AI_TOKEN_LIMITS.elite;
  if (tier === 'pro') {
     if (profile?.subscription_end_date && new Date(profile.subscription_end_date) < now) {
       return AI_TOKEN_LIMITS.free;
     }
     return AI_TOKEN_LIMITS.pro;
  }
  if (tier === 'trial') {
      if (isTrialActive(profile, now)) {
          return AI_TOKEN_LIMITS.trial;
      }
      return AI_TOKEN_LIMITS.free;
  }
  return AI_TOKEN_LIMITS.free;
};

export const getEffectiveAiTokenLimit = (profile: ProfileForSubscriptionRules | null | undefined, now: Date = new Date()): number => {
  if (profile?.ai_token_limit !== undefined && profile?.ai_token_limit !== null) {
    const limitNum = Number(profile.ai_token_limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      return limitNum;
    }
  }

  if (isAdminRole(profile?.role)) return AI_TOKEN_LIMITS.admin;
  
  return getDefaultAiTokenLimit(profile, now);
};
