import { useAuth } from '../AuthContext';
import { FeatureKey, SubscriptionTier } from '../types/subscription';
import { FEATURE_ACCESS_CONFIG, TIER_HIERARCHY } from '../config/featureAccess';

export const useFeatureAccess = () => {
  const { profile, subscribe } = useAuth();
  
  const userTier: SubscriptionTier = profile?.tier || 'free';
  
  // Kullanıcının abonelik tipinin 'trial' (deneme) olup olmadığını kontrol ediyoruz
  const isTrial = profile?.subscription_type === 'trial';

  const hasAccess = (featureKey: FeatureKey): boolean => {
    const config = FEATURE_ACCESS_CONFIG[featureKey];
    if (!config) return false;

    const userLevel = TIER_HIERARCHY[userTier];
    const requiredLevel = TIER_HIERARCHY[config.minTier];

    // 🔥 SIKI KURAL (Seçenek 2):
    // Eğer kullanıcı deneme (trial) sürümündeyse ve özellik paralı bir pakete aitse (free'den büyükse) 
    // seviyesi ne olursa olsun erişimi anında REDDET!
    if (isTrial && requiredLevel > TIER_HIERARCHY['free']) {
      return false;
    }

    return userLevel >= requiredLevel;
  };

  const getFeatureConfig = (featureKey: FeatureKey) => {
    return FEATURE_ACCESS_CONFIG[featureKey];
  };

  return {
    userTier,
    hasAccess,
    getFeatureConfig,
    subscribe,
    isFree: userTier === 'free',
    isPro: userTier === 'pro',
    isElite: userTier === 'elite',
    isMaster: userTier === 'master'
  };
};