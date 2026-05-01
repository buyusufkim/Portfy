import { UserProfile } from '../types';

export const AI_TOKEN_LIMITS = {
  admin: 1000000,
  master: 100000,
  elite: 50000,
  pro: 10000,
  trial: 10000,
  free: 1000,
  none: 1000
};

export const normalizeTier = (profile: any): string => {
  if (profile?.role === 'admin') return 'admin';
  if (profile?.tier === 'master' || profile?.subscription_type?.includes('master')) return 'master';
  if (profile?.tier === 'elite') return 'elite';
  if (profile?.tier === 'pro' || profile?.subscription_type === '1-month' || profile?.subscription_type === '3-month' || profile?.subscription_type === '6-month' || profile?.subscription_type === '12-month') return 'pro';
  
  if (profile?.tier === 'trial' || profile?.subscription_type === 'trial') return 'trial';

  return 'free';
};

export const isTrialActive = (profile: any): boolean => {
  const tier = normalizeTier(profile);
  if (tier !== 'trial') return false;

  if (profile?.subscription_end_date) {
    const endDate = new Date(profile.subscription_end_date);
    if (endDate < new Date()) {
      return false; // Trial has expired
    }
  }
  return true;
};

export const isPremiumActive = (profile: any): boolean => {
  if (profile?.role === 'admin') return true;
  const tier = normalizeTier(profile);
  if (tier === 'admin' || tier === 'master' || tier === 'elite' || tier === 'pro') {
    if (profile?.subscription_end_date) {
      const endDate = new Date(profile.subscription_end_date);
      if (endDate < new Date()) {
        return false;
      }
    }
    return true;
  }
  return isTrialActive(profile);
};

export const getDefaultAiTokenLimit = (profile: any): number => {
  const tier = normalizeTier(profile);
  
  if (tier === 'admin') return AI_TOKEN_LIMITS.admin;
  if (tier === 'master') return AI_TOKEN_LIMITS.master;
  if (tier === 'elite') return AI_TOKEN_LIMITS.elite;
  if (tier === 'pro') {
     // Ensure it's active
     if (profile?.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
       return AI_TOKEN_LIMITS.free;
     }
     return AI_TOKEN_LIMITS.pro;
  }
  if (tier === 'trial') {
      if (isTrialActive(profile)) {
          return AI_TOKEN_LIMITS.trial;
      }
      return AI_TOKEN_LIMITS.free;
  }
  return AI_TOKEN_LIMITS.free;
};

export const getEffectiveAiTokenLimit = (profile: any): number => {
  if (profile?.ai_token_limit !== undefined && profile?.ai_token_limit !== null) {
    const limitNum = Number(profile.ai_token_limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      return limitNum;
    }
  }

  if (profile?.role === 'admin') return AI_TOKEN_LIMITS.admin;
  
  return getDefaultAiTokenLimit(profile);
};
