import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ArrowRight, MessageCircle } from 'lucide-react';
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

const getDisplayPlanName = (plan: any) => {
  const name = String(plan?.name || '').trim();
  if (!name) return 'Master';
  return name.toLowerCase().includes('master') ? name : `${name} Master`;
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [masterOptions, setMasterOptions] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waNumber, setWaNumber] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: pkgData } = await supabase.from('subscription_packages').select('*').eq('is_active', true).neq('tier', 'free').order('price_numeric', { ascending: true });
      if (pkgData && pkgData.length > 0) {
        setMasterOptions(pkgData);
        setSelectedDuration(pkgData.length > 1 ? pkgData[1] : pkgData[0]);
      }
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
    const currentPlan = profile?.tier === 'free' ? 'Başlangıç (Ücretsiz)' : 'Deneme Sürümü / Diğer';
    
    const text = `Merhaba Portfy! Aktivasyon talebinde bulunmak istiyorum. 🚀\n\n👤 *İsim Soyisim:* ${userName}\n📊 *Mevcut Paket:* ${currentPlan}\n✨ *Geçilmek İstenen Paket:* ${getDisplayPlanName(selectedDuration)}\n💰 *Paket Ücreti:* ${selectedDuration.price_text} ${selectedDuration.interval}`;
    
    const url = `https://wa.me/${normalizedWa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 pb-safe">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full md:h-auto md:max-h-[85vh]">
          {/* Hero Section */}
          <div className="bg-slate-900 px-6 py-8 md:p-12 md:w-5/12 flex flex-col justify-center relative overflow-hidden shrink-0">
            <div className="relative z-10 space-y-3 md:space-y-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
                <Crown className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">Sınırları Kaldırma Zamanı</h2>
              <p className="text-slate-400 text-sm md:text-base leading-snug md:leading-relaxed max-w-[280px] md:max-w-none">
                Portfy'nin tüm yapay zeka, CRM ve portföy gücünü açmak için Master planını seç.
              </p>
            </div>
            {/* Soft background glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 md:w-80 md:h-80 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[60px] md:blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 md:w-80 md:h-80 bg-teal-500/20 rounded-full mix-blend-screen filter blur-[60px] md:blur-[80px]" />
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-slate-50 p-5 md:p-10 md:w-7/12 flex flex-col relative overflow-y-auto w-full pb-24 md:pb-10">
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full transition-colors shadow-sm ring-1 ring-slate-200 z-10">
              <X size={20} />
            </button>
            
            <div className="mb-4 md:mb-8 pr-12 md:pr-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Planını Seç</h3>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 mb-8 flex-1">
                {masterOptions.map((opt) => {
                  const isSelected = selectedDuration?.id === opt.id;
                  let badgeColor = "bg-amber-100 text-amber-700 ring-amber-600/20";
                  if (opt.badge && opt.badge.toLowerCase().includes('ömür boyu')) {
                    badgeColor = "bg-emerald-100 text-emerald-700 ring-emerald-600/20";
                  } else if (opt.badge && opt.badge.includes('25')) {
                    badgeColor = "bg-indigo-100 text-indigo-700 ring-indigo-600/20";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedDuration(opt)}
                      className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-500/10' : 'border-white bg-white shadow-sm hover:border-slate-200 hover:shadow-md'}`}
                    >
                      <div className="flex flex-col items-start gap-1.5 flex-1 pr-4">
                        <span className={`font-bold tracking-tight ${isSelected ? 'text-indigo-900 text-lg' : 'text-slate-700 text-base'}`}>{getDisplayPlanName(opt)}</span>
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
            )}
            
            <div className="mt-auto pt-4 relative z-10 space-y-2">
              {isValidWa ? (
                <>
                  <button 
                    onClick={handleActivationRequest}
                    disabled={loading || !selectedDuration}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 disabled:opacity-50"
                  >
                    <MessageCircle size={20} className="text-indigo-400" /> WhatsApp'tan Planı Aktifleştir <ArrowRight size={18} className="ml-1 opacity-70" />
                  </button>
                  <p className="text-center text-xs text-slate-500 font-medium">
                    Seçtiğin plan için satış ekibine yönlendirilirsin.
                  </p>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    disabled
                    className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <MessageCircle size={20} className="opacity-50" /> Satış hattı tanımlanmadı
                  </button>
                  <p className="text-center text-xs text-slate-500 font-medium">
                    Yönetim panelinden WhatsApp satış hattı eklenmeli.
                  </p>
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
