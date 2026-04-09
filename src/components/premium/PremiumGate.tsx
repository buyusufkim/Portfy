import React, { useState } from 'react';
import { FeatureKey, SubscriptionTier } from '../../types/subscription';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { LockedOverlay } from './LockedOverlay';
import { UpgradeModal } from './UpgradeModal';

interface PremiumGateProps {
  featureKey: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showOverlay?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  featureKey, 
  children, 
  fallback, 
  showOverlay = true 
}) => {
  const { hasAccess } = useFeatureAccess();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const canAccess = hasAccess(featureKey);

  const handleUpgrade = () => {
    setIsUpgradeModalOpen(true);
  };

  const handlePlanSelect = (tier: SubscriptionTier) => {
    console.log(`Selected plan: ${tier}`);
    // Implement actual subscription logic here
    setIsUpgradeModalOpen(false);
  };

  if (canAccess) {
    return <>{children}</>;
  }

  if (showOverlay) {
    return (
      <div className="relative">
        <div className="filter blur-[2px] pointer-events-none select-none opacity-50">
          {children}
        </div>
        <LockedOverlay 
          featureKey={featureKey} 
          onUpgrade={handleUpgrade} 
        />
        <UpgradeModal 
          isOpen={isUpgradeModalOpen} 
          onClose={() => setIsUpgradeModalOpen(false)} 
          onSelectPlan={handlePlanSelect}
        />
      </div>
    );
  }

  return (
    <>
      {fallback || null}
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onSelectPlan={handlePlanSelect}
      />
    </>
  );
};
