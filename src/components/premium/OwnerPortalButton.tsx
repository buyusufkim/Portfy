import React, { useState } from 'react';
import { Share2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { UpgradeModal } from './UpgradeModal';

interface OwnerPortalButtonProps {
  propertyId: string;
}

export const OwnerPortalButton: React.FC<OwnerPortalButtonProps> = ({ propertyId }) => {
  const { isFree } = useFeatureAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = () => {
    // Sadece Master üyeler bu özelliği kullanabilir (veya Elite)
    if (isFree) {
      setShowUpgrade(true);
      return;
    }

    // Linki oluştur ve panoya kopyala
    const baseUrl = window.location.origin;
    const portalLink = `${baseUrl}/portal/${propertyId}`;
    
    navigator.clipboard.writeText(portalLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <>
      <button 
        onClick={handleCreateLink}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${
          copied 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {copied ? (
          <>
            <CheckCircle2 size={18} /> Bağlantı Kopyalandı!
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Mülk Sahibi Şeffaflık Raporu Al
          </>
        )}
      </button>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        onSelectPlan={(tier) => console.log(tier)} 
      />
    </>
  );
};
