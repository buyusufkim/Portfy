import { useAuth } from '../AuthContext';
import { FeatureKey, SubscriptionTier } from '../types/subscription';
import { FEATURE_ACCESS_CONFIG, TIER_HIERARCHY } from '../config/featureAccess';

export const useFeatureAccess = () => {
  const { profile } = useAuth();
  
  // Map existing subscriptionType to new tiers if needed, 
  // or assume a 'tier' field exists on profile.
  // For this implementation, we'll assume profile has a 'tier' field.
  const userTier: SubscriptionTier = profile?.tier || 'free';

  const hasAccess = (featureKey: FeatureKey): boolean => {
    const config = FEATURE_ACCESS_CONFIG[featureKey];
    if (!config) return false;

    const userLevel = TIER_HIERARCHY[userTier];
    const requiredLevel = TIER_HIERARCHY[config.minTier];

    return userLevel >= requiredLevel;
  };

  const getFeatureConfig = (featureKey: FeatureKey) => {
    return FEATURE_ACCESS_CONFIG[featureKey];
  };

  return {
    userTier,
    hasAccess,
    getFeatureConfig,
    isFree: userTier === 'free',
    isPro: userTier === 'pro',
    isElite: userTier === 'elite',
    isMaster: userTier === 'master'
  };
};
