import { useAuth } from '../AuthContext';
import { FeatureKey, SubscriptionTier } from '../types/subscription';
import { FEATURE_ACCESS_CONFIG, TIER_HIERARCHY } from '../config/featureAccess';
import { normalizeTier, isPremiumActive } from '../config/subscriptionLimits';

export const useFeatureAccess = () => {
  const { profile, subscribe } = useAuth();
  
  const effectiveTier = normalizeTier(profile) as SubscriptionTier;
  const userTier = profile?.tier || 'free';
  
  const hasAccess = (featureKey: FeatureKey): boolean => {
    const config = FEATURE_ACCESS_CONFIG[featureKey];
    if (!config) return false;

    // Admin has access to everything
    if (profile?.role === 'admin') return true;

    const userLevel = TIER_HIERARCHY[effectiveTier] || 0;
    const requiredLevel = TIER_HIERARCHY[config.minTier] || 0;

    // Check if subscription has expired for premium features
    if (requiredLevel > 0 && !isPremiumActive(profile)) {
      return false; // Expired users fall back to no premium access
    }

    return userLevel >= requiredLevel;
  };

  const getFeatureConfig = (featureKey: FeatureKey) => {
    return FEATURE_ACCESS_CONFIG[featureKey];
  };

  return {
    userTier: effectiveTier,
    hasAccess,
    getFeatureConfig,
    subscribe,
    isFree: effectiveTier === 'free',
    isPro: effectiveTier === 'pro',
    isElite: effectiveTier === 'elite',
    isMaster: effectiveTier === 'master'
  };
};