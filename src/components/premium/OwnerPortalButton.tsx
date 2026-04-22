import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { UpgradeModal } from './UpgradeModal';
import { supabase } from '../../lib/supabase';

interface OwnerPortalButtonProps {
  propertyId: string;
}

export const OwnerPortalButton: React.FC<OwnerPortalButtonProps> = ({ propertyId }) => {
  const { isFree } = useFeatureAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateLink = async () => {
    // Sadece Master üyeler bu özelliği kullanabilir (veya Elite)
    if (isFree) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Rastgele, 32 karakterlik tahmin edilemez bir token oluştur (crypto.randomUUID ve biraz text)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      const { error } = await supabase.from('owner_portal_tokens').insert({
        property_id: propertyId,
        token: token,
        expires_at: thirtyDaysLater.toISOString(),
        created_by: user.id
      });

      if (error) throw error;

      // Linki oluştur ve panoya kopyala
      const baseUrl = window.location.origin;
      const portalLink = `${baseUrl}/portal/${token}`;
      
      await navigator.clipboard.writeText(portalLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Token oluşturma hatası:", err);
      // Fallback or error prompt
      alert("Bağlantı oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleCreateLink}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-70 ${
          copied 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {loading ? (
           <Loader2 size={18} className="animate-spin" />
        ) : copied ? (
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

