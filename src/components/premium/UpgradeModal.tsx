import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ArrowRight, MessageCircle, Check, Play, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../AuthContext';

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

const MASTER_PLANS = [
  { id: '1-month', name: 'Master / Aylık', price_text: '499 ₺', interval: '/ ay', badge: '' },
  { id: '3-month', name: 'Master / 3 Aylık', price_text: '1.250 ₺', interval: '/ 3 ay', badge: 'Avantajlı' },
  { id: '6-month', name: 'Master / 6 Aylık', price_text: '1.999 ₺', interval: '/ 6 ay', badge: '%33 İndirim' },
  { id: '12-month', name: 'Master / 12 Aylık', price_text: '2.999 ₺', interval: '/ yıl', badge: 'En İyi Fiyat' },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onActivateTrial }) => {
  const { profile } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<any>(MASTER_PLANS[0]);
  const [loading, setLoading] = useState(true);
  const [waNumber, setWaNumber] = useState('');
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: setData } = await supabase.from('system_settings').select('whatsapp_number').eq('id', 1).single();
      if (setData) setWaNumber(setData.whatsapp_number);
      
      setLoading(false);
    };
    fetchData();
  }, [isOpen]);

  const normalizedWa = normalizeWhatsAppNumber(waNumber);
  const isValidWa = isValidWhatsAppNumber(normalizedWa);

  const handleActivationRequest = () => {
    if (!selectedDuration || !isValidWa) return;
    const userName = profile?.display_name || 'Bilinmeyen Kullanıcı';
    const currentPlan = profile?.tier === 'free' ? 'Girişimci' : 'Deneme Sürümü / Diğer';
    
    const text = `Merhaba Portfy! Aktivasyon talebinde bulunmak istiyorum. 🚀\n\n👤 *İsim Soyisim:* ${userName}\n📊 *Mevcut Paket:* ${currentPlan}\n✨ *Geçilmek İstenen Paket:* ${selectedDuration.name}\n💰 *Paket Ücreti:* ${selectedDuration.price_text} ${selectedDuration.interval}`;
    
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 pb-safe">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-white md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full md:h-auto md:max-h-[90vh]">
          {/* Comparison / Features Section */}
          <div className="bg-slate-50 px-6 py-8 md:p-10 md:w-5/12 flex flex-col relative overflow-y-auto border-r border-slate-100 shrink-0">
            <div className="relative z-10 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight mb-2">Master'a Geç</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Portfy'nin tüm gücünü ve yapay zeka sınırlarını açın.
                </p>
              </div>

              {/* Free Plan Specs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-600">Girişimci</span>
                  <span className="text-sm font-black text-slate-900">0 ₺</span>
                </div>
                <ul className="text-slate-500 text-xs space-y-2 font-medium">
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"/> Temel kullanım</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"/> Sınırlı AI özellikleri</li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"/> 25.000 token / ay</li>
                </ul>
              </div>

              {/* Master Plan Specs */}
              <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Crown size={64} className="text-indigo-600"/>
                </div>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                    <Crown size={16} />
                  </div>
                  <span className="text-base font-black text-indigo-900 tracking-tight">Master Özellikleri</span>
                </div>
                <ul className="text-indigo-900/80 text-sm space-y-3 font-medium relative z-10">
                  <li className="flex items-start gap-2"><Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> Tüm modüllere sınırsız erişim</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> Gelişmiş AI Koç Analizleri</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> Tek Tıkla Portföy Pazarlama Üretimi</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> 90 Günlük Danışman Kampı Eğitimleri</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> Bölgem - Piyasa Analiz Modülü</li>
                  <li className="flex items-start gap-2"><Check size={16} className="text-indigo-600 mt-0.5 shrink-0"/> <span className="font-bold text-indigo-700">300.000 AI token / ay</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Checkout / Selection Section */}
          <div className="bg-white p-5 md:p-10 md:w-7/12 flex flex-col relative overflow-y-auto w-full pb-24 md:pb-10">
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-10">
              <X size={20} />
            </button>
            
            <div className="mb-6 md:mb-8 pr-12 md:pr-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Süreyi Seçin</h3>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {MASTER_PLANS.map((opt) => {
                const isSelected = selectedDuration?.id === opt.id;
                let badgeColor = "bg-amber-100 text-amber-700 ring-amber-600/20";
                if (opt.badge && opt.badge.includes('İndirim')) {
                  badgeColor = "bg-emerald-100 text-emerald-700 ring-emerald-600/20";
                } else if (opt.badge && opt.badge.includes('En İyi')) {
                  badgeColor = "bg-indigo-100 text-indigo-700 ring-indigo-600/20";
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedDuration(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-500/5' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex flex-col items-start gap-1 flex-1 pr-4">
                      <span className={`font-bold tracking-tight ${isSelected ? 'text-indigo-900 text-lg' : 'text-slate-700 text-base'}`}>{opt.name}</span>
                      {opt.badge && (
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ring-1 ring-inset inline-block ${badgeColor}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className={`text-xl sm:text-2xl font-black tracking-tight ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>{opt.price_text}</span>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">{opt.interval}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-auto pt-4 relative z-10 space-y-4">
              {!hasUsedTrial && onActivateTrial && (
                 <button 
                  onClick={handleTrial}
                  disabled={isActivatingTrial || loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                 >
                   {isActivatingTrial ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <>
                       <Play fill="currentColor" size={16} className="text-indigo-100" /> Master'ı 7 Gün Ücretsiz Dene
                     </>
                   )}
                 </button>
              )}

              <button 
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { packageRequestService } = await import('../../services/packageRequestService');
                    await packageRequestService.createPackageRequest({
                      requested_duration: selectedDuration.id
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
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 disabled:opacity-50"
              >
                Paket Talebi Oluştur <ArrowRight size={18} className="ml-1 opacity-70" />
              </button>

              {isValidWa ? (
                <>
                  <button 
                    onClick={handleActivationRequest}
                    disabled={loading || !selectedDuration}
                    className="w-full py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl font-semibold hover:bg-green-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MessageCircle size={20} /> Satış Ekibine WhatsApp'tan Ulaşın
                  </button>
                  <p className="text-center text-xs text-slate-500 font-medium px-4 mt-2">
                    Talebinizi oluşturduktan sonra havale/EFT ile ödeme işlemini tamamlamak için satış ekibimizle iletişime geçebilirsiniz.
                  </p>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    disabled
                    className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed mt-2"
                  >
                    <MessageCircle size={20} className="opacity-50" /> Satın alma şu an deaktif
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
