import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CheckCircle2, Globe, FileText, Instagram, MessageCircle } from 'lucide-react';

const Users = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

interface MarketingHubModalProps {
  show: boolean;
  onClose: () => void;
  marketingHubData: any;
  onGenerateListing?: () => void;
  onGenerateInstagram?: () => void;
  onGenerateWhatsApp?: () => void;
}

export const MarketingHubModal: React.FC<MarketingHubModalProps> = ({
  show,
  onClose,
  marketingHubData,
  onGenerateListing,
  onGenerateInstagram,
  onGenerateWhatsApp
}) => {
  return (
    <AnimatePresence>
      {show && marketingHubData && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-4xl rounded-[40px] p-0 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Marketing Hub</h2>
                  <p className="text-xs text-slate-500">Yapay zeka destekli pazarlama asistanı</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 border border-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8">
              
              {/* AI İçerik Üretim Butonları (YENİ) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={onGenerateListing}
                  className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col items-center gap-3 hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-900 text-sm">İlan Metni Üret</div>
                    <div className="text-[10px] text-blue-600 mt-1">Sahibinden ve Hepsiemlak için</div>
                  </div>
                </button>

                <button 
                  onClick={onGenerateInstagram}
                  className="p-5 bg-pink-50 border border-pink-100 rounded-3xl flex flex-col items-center gap-3 hover:bg-pink-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pink-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Instagram size={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-pink-900 text-sm">Instagram Postu</div>
                    <div className="text-[10px] text-pink-600 mt-1">Kurumsal ve Satış Odaklı</div>
                  </div>
                </button>

                <button 
                  onClick={onGenerateWhatsApp}
                  className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center gap-3 hover:bg-emerald-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                    <MessageCircle size={24} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-emerald-900 text-sm">WhatsApp Mesajı</div>
                    <div className="text-[10px] text-emerald-600 mt-1">Durum ve Yatırımcıya Özel</div>
                  </div>
                </button>
              </div>

              <div className="w-full h-px bg-slate-100 my-4" />

              {/* Target Audience */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" /> Hedef Kitle Analizi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {marketingHubData.targetAudience.map((audience: any, i: number) => (
                    <div key={i} className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="font-bold text-blue-900 text-sm mb-1">{audience.type}</div>
                      <p className="text-[10px] text-blue-700 leading-relaxed">{audience.reason}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Value Propositions */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" /> Öne Çıkan Değerler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {marketingHubData.valuePropositions.map((prop: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-100">
                      {prop}
                    </span>
                  ))}
                </div>
              </section>

              {/* Marketing Channels */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe size={18} className="text-purple-600" /> Kanal Stratejileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {marketingHubData.channelStrategies.map((strategy: any, i: number) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">{strategy.channel}</div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-purple-600 rounded-lg uppercase tracking-wider">
                          {strategy.priority} Öncelik
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{strategy.action}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20"
              >
                Stratejiyi Kapat
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};