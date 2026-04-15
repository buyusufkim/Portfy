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
  const { hasAccess, subscribe } = useFeatureAccess();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const canAccess = hasAccess(featureKey);

  const handleUpgrade = () => {
    setIsUpgradeModalOpen(true);
  };

  const handlePlanSelect = async (tier: SubscriptionTier) => {
    // Paid plans are currently handled via a manual upgrade message in the UpgradeModal UI.
    // This handler is kept for future use when instant paid activation is implemented.
    console.log(`Plan selected: ${tier}. Paid activation is currently manual.`);
  };

  const handleActivateTrial = async () => {
    try {
      await subscribe('trial');
      setIsUpgradeModalOpen(false);
    } catch (error) {
      console.error('Trial activation error:', error);
    }
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
          onActivateTrial={handleActivateTrial}
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
        onActivateTrial={handleActivateTrial}
      />
    </>
  );
};
