import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MapPin, Users, Home, Camera, Edit3, ChevronLeft } from 'lucide-react';

// Daha minimal ikon butonu
const MinimalQuickAddButton = ({ icon, title, color, onClick }: { icon: React.ReactNode, title: string, color: string, onClick?: () => void }) => (
  <button 
    onClick={onClick} 
    className="flex flex-col items-center gap-2.5 w-full group active:scale-90 transition-transform"
  >
    {/* Daha küçük ve zarif daire (w-16 h-16) */}
    <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center shrink-0 shadow-sm border border-black/5`}>
      {icon}
    </div>
    {/* Daha temiz font ağırlığı ve boyutu */}
    <span className="text-[13px] font-semibold text-[#334155] leading-tight text-center">
      {title}
    </span>
  </button>
);

interface QuickAddMenuProps {
  show: boolean;
  onClose: () => void;
  onVoice: () => void;
  onVisit: () => void;
  onLead: () => void;
  onPortfolio: () => void;
}

export const QuickAddMenu = ({ 
  show, 
  onClose, 
  onVoice, 
  onVisit, 
  onLead, 
  onPortfolio 
}: QuickAddMenuProps) => {
  const [leadMode, setLeadMode] = useState(false);

  const handleClose = () => {
    setLeadMode(false);
    onClose();
  };

  const iconColors = {
    sesli: "bg-[#FFF1F2] text-[#E11D48]",
    ziyaret: "bg-[#FFF7ED] text-[#EA580C]",
    lead: "bg-[#EFF6FF] text-[#2563EB]",
    portfoy: "bg-[#F5F3FF] text-[#7C3AED]"
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60]"
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[70] shadow-2xl overflow-hidden"
          >
            {/* Tutamaç */}
            <div className="w-12 h-1 bg-[#E2E8F0] rounded-full mx-auto mt-4" />
            
            {!leadMode ? (
              <div className="pt-8 pb-10 px-6">
                <h2 className="text-[20px] font-bold text-[#0F172A] mb-8 text-center tracking-tight">Hızlı Kayıt</h2>
                
                {/* 4'lü Grid - Gap azaltıldı */}
                <div className="grid grid-cols-4 gap-2">
                  <MinimalQuickAddButton 
                    onClick={() => { handleClose(); onVoice(); }}
                    icon={<Mic size={24} strokeWidth={2} />} 
                    title="Sesli" 
                    color={iconColors.sesli} 
                  />
                  
                  <MinimalQuickAddButton 
                    onClick={() => { handleClose(); onVisit(); }}
                    icon={<MapPin size={24} strokeWidth={2} />} 
                    title="Ziyaret" 
                    color={iconColors.ziyaret} 
                  />
                  
                  <MinimalQuickAddButton 
                    onClick={() => setLeadMode(true)}
                    icon={<Users size={24} strokeWidth={2} />} 
                    title="Lead" 
                    color={iconColors.lead} 
                  />
                  
                  <MinimalQuickAddButton 
                    onClick={() => { handleClose(); onPortfolio(); }}
                    icon={<Home size={24} strokeWidth={2} />} 
                    title="Portföy" 
                    color={iconColors.portfoy} 
                  />
                </div>
              </div>
            ) : (
              <div className="pt-8 pb-10 px-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-center relative mb-8">
                  <button 
                    onClick={() => setLeadMode(false)} 
                    className="absolute left-0 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-[18px] font-bold text-[#0F172A]">Müşteri Ekle</h2>
                </div>

                <div className="flex justify-center gap-12">
                  <MinimalQuickAddButton 
                    onClick={() => { handleClose(); onLead(); }} 
                    icon={<Camera size={24} strokeWidth={2} />} 
                    title="Kartvizit" 
                    color={iconColors.lead} 
                  />
                  <MinimalQuickAddButton 
                    onClick={() => { handleClose(); onLead(); }} 
                    icon={<Edit3 size={24} strokeWidth={2} />} 
                    title="Manuel" 
                    color={iconColors.sesli} 
                  />
                </div>
              </div>
            )}

            {/* Vazgeç Butonu - Görseldeki gibi tam genişlikte ve gri tonda */}
            <button 
              onClick={handleClose}
              className="w-full bg-[#F8FAFC] hover:bg-[#F1F5F9] py-5 text-[#64748B] font-bold text-[15px] border-t border-[#F1F5F9] transition-colors pb-safe"
            >
              Vazgeç
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};