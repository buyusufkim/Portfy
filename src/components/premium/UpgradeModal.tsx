import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ArrowRight, MessageCircle, Check, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../AuthContext';
import { PUBLIC_PLANS, SubscriptionPackageRow } from '../../shared/packageCatalog';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (tier: string) => void;
  onActivateTrial?: () => Promise<void> | void;
}

const normalizeWhatsAppNumber = (num: string | null | undefined): string => {
  if (!num) return '';
  let cleaned = num.replace(/\D/g, ''); // Sadece rakamları al
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '90' + cleaned.substring(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 10) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
};

const isValidWhatsAppNumber = (normalized: string): boolean => {
  if (!normalized) return false;
  if (normalized === '905000000000' || normalized === '900000000000') return false;
  if (normalized.length < 12) return false;
  if (!normalized.startsWith('90')) return false;
  return true;
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onActivateTrial }) => {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<SubscriptionPackageRow[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<SubscriptionPackageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [waNumber, setWaNumber] = useState('');
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: setData }, { data: pkgData }] = await Promise.all([
        supabase.from('system_settings').select('whatsapp_number').eq('id', 1).single(),
        supabase.from('subscription_packages').select('*').eq('is_active', true).eq('tier', 'master').order('price_numeric', { ascending: true })
      ]);
      
      if (setData) setWaNumber(setData.whatsapp_number);
      if (pkgData && pkgData.length > 0) {
        setPackages(pkgData);
        setSelectedDuration(pkgData.find(p => p.id === '1-month') || pkgData[0]);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [isOpen]);

  const normalizedWa = normalizeWhatsAppNumber(waNumber);
  const isValidWa = isValidWhatsAppNumber(normalizedWa);
  const masterConfig = PUBLIC_PLANS.find(p => p.key === 'master')!;

  const handleActivationRequest = () => {
    if (!selectedDuration || !isValidWa) return;
    const userName = profile?.display_name || 'Bilinmeyen Kullanıcı';
    const currentPlan = profile?.tier === 'free' ? 'Girişimci' : 'Deneme Sürümü / Diğer';
    
    const text = `Merhaba Portfy! Paket talebinde bulunmak istiyorum. 🚀\n\n👤 *İsim Soyisim:* ${userName}\n📊 *Mevcut Paket:* ${currentPlan}\n✨ *Geçilmek İstenen Paket:* ${selectedDuration.name}\n💰 *Paket Ücreti:* ${selectedDuration.price_text} ${selectedDuration.interval || ''}`;
    
    const url = `https://wa.me/${normalizedWa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleTrial = async () => {
    if (onActivateTrial) {
      setIsActivatingTrial(true);
      try {
        await onActivateTrial();
        onClose();
      } finally {
        setIsActivatingTrial(false);
      }
    }
  };

  const hasUsedTrial = profile?.tier !== 'free' || profile?.subscription_type === 'trial';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-0 sm:pb-safe">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, y: '100%', scale: 1 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: '100%', scale: 1 }} className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20">
            <X size={20} />
          </button>

          {/* Header */}
          <div className="px-6 pt-8 pb-6 bg-slate-50 border-b border-slate-100 relative overflow-hidden shrink-0">
            <div className="absolute -top-12 -right-12 text-indigo-500/10 pointer-events-none">
              <Crown size={180} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight mb-2">{masterConfig.name}'a Geç</h2>
              <p className="text-slate-500 text-sm leading-relaxed pr-8">
                {masterConfig.description}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                
                {packages.length === 0 ? (
                  <div className="bg-slate-50 text-slate-500 text-sm font-medium p-4 rounded-xl text-center border border-slate-100">
                    Master paket bilgisi şu an alınamadı. Lütfen daha sonra tekrar deneyin.
                  </div>
                ) : (
                  <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1">
                    {packages.map((opt) => {
                      const isSelected = selectedDuration?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedDuration(opt)}
                          className={`flex-1 min-w-[70px] py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${isSelected ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          {opt.name.replace('Master / ', '')}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedDuration && (
                  <div className="bg-white border-2 border-indigo-500 rounded-2xl p-5 shadow-sm relative">
                    {selectedDuration.badge && (
                      <span className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                        {selectedDuration.badge}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-500 mb-1">{selectedDuration.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-900">{selectedDuration.price_text}</span>
                      <span className="text-slate-500 font-medium text-sm">{selectedDuration.interval}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 px-1">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">PAKET İÇERİĞİ</h4>
                  <ul className="text-slate-600 text-sm space-y-2.5 font-medium">
                    {masterConfig.highlights.slice(0, 6).map((hl: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> {hl}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] shrink-0 space-y-3 relative z-10 w-full mb-safe">
            <button 
              onClick={async () => {
                try {
                  setLoading(true);
                  const { packageRequestService } = await import('../../services/packageRequestService');
                  await packageRequestService.createPackageRequest({
                    requested_duration: selectedDuration?.id
                  });
                  alert('Paket talebiniz alındı. En kısa sürede iletişime geçeceğiz.');
                  onClose();
                } catch (err: unknown) {
                  alert(err instanceof Error ? err.message : 'Bir hata oluştu');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !selectedDuration}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              Paket Talebi Oluştur
            </button>

            {isValidWa && (
              <button 
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { packageRequestService } = await import('../../services/packageRequestService');
                    await packageRequestService.createPackageRequest({
                      requested_duration: selectedDuration?.id
                    }).catch(err => {
                      if (!err.message.includes('Zaten bekleyen')) throw err;
                    });
                    handleActivationRequest();
                    onClose();
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : 'Bir hata oluştu');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !selectedDuration}
                className="w-full py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl font-semibold hover:bg-green-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageCircle size={18} /> WhatsApp'tan Satış Ekibine Yaz
              </button>
            )}
            
            {!hasUsedTrial && onActivateTrial && (
               <button 
                onClick={handleTrial}
                disabled={isActivatingTrial || loading}
                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isActivatingTrial ? (
                   <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                 ) : (
                   <>
                     <Play fill="currentColor" size={14} /> 7 Gün Ücretsiz Dene
                   </>
                 )}
               </button>
            )}
          </div>
          
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
