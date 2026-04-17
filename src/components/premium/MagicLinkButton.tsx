import React, { useState } from 'react';
import { Link as LinkIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { UpgradeModal } from './UpgradeModal';

interface MagicLinkButtonProps {
  propertyId: string;
}

export const MagicLinkButton: React.FC<MagicLinkButtonProps> = ({ propertyId }) => {
  const { isFree } = useFeatureAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = () => {
    // Sadece Master üyeler bu özelliği kullanabilir
    if (isFree) {
      setShowUpgrade(true);
      return;
    }

    // Linki oluştur ve panoya kopyala
    const baseUrl = window.location.origin; // Örn: https://portfy.app
    const magicLink = `${baseUrl}/p/${propertyId}`;
    
    navigator.clipboard.writeText(magicLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000); // 3 saniye sonra geri dön
    });
  };

  return (
    <>
      <button 
        onClick={handleCreateLink}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${
          copied 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
        }`}
      >
        {copied ? (
          <>
            <CheckCircle2 size={18} /> Link Kopyalandı!
          </>
        ) : (
          <>
            <Sparkles size={18} className="text-indigo-500" />
            <LinkIcon size={18} />
            Müşteriye Özel Sunum Linki Al
          </>
        )}
      </button>

      {/* Ücretsiz kullanıcılar için satış ekranı */}
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        onSelectPlan={(tier) => console.log(tier)} 
      />
    </>
  );
};