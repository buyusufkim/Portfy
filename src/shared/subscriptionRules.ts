export const isAdminRoleForSubscription = (role: string | null | undefined): boolean => {
  return role === 'admin' || role === 'super_admin';
};

export const AI_TOKEN_LIMITS = {
  admin: 1000000,
  master: 300000,
  trial: 100000,
  free: 25000,
  none: 25000
};

export type SubscriptionTier = 'admin' | 'master' | 'trial' | 'free' | 'none';

export type SubscriptionRole = 'agent' | 'admin' | 'super_admin' | string | null | undefined;

export interface ProfileForSubscriptionRules {
  role?: SubscriptionRole;
  tier?: string | null;
  subscription_type?: string | null;
  subscription_end_date?: string | null;
  ai_token_limit?: number | string | null;
}

export const normalizeTier = (profile: ProfileForSubscriptionRules | null | undefined): string => {
  if (isAdminRoleForSubscription(profile?.role)) return 'admin';
  
  const tier = profile?.tier || '';
  const subType = profile?.subscription_type || '';

  if (
    tier === 'master' || tier === 'elite' || tier === 'pro' || tier === 'paid' ||
    subType.includes('master') || 
    subType === '1-month' || subType === '3-month' || 
    subType === '6-month' || subType === '9-month' || subType === '12-month'
  ) return 'master';
  
  if (tier === 'trial' || subType === 'trial') return 'trial';

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
  if (isAdminRoleForSubscription(profile?.role)) return true;
  const tier = normalizeTier(profile);
  if (tier === 'admin' || tier === 'master') {
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
  if (tier === 'master') {
     if (profile?.subscription_end_date && new Date(profile.subscription_end_date) < now) {
       return AI_TOKEN_LIMITS.free;
     }
     return AI_TOKEN_LIMITS.master;
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
  if (isAdminRoleForSubscription(profile?.role)) return AI_TOKEN_LIMITS.admin;

  if (profile?.ai_token_limit !== undefined && profile?.ai_token_limit !== null) {
    const limitNum = Number(profile.ai_token_limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      return limitNum;
    }
  }

  return getDefaultAiTokenLimit(profile, now);
};
