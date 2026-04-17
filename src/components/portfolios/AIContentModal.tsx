import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Instagram, MessageCircle, Sparkles, RefreshCw, Copy } from 'lucide-react';
import { Property } from '../../types';

interface AIContentModalProps {
  aiMarketingType: 'listing' | 'instagram' | 'whatsapp' | 'share' | 'hub' | null;
  onClose: () => void;
  isGenerating: boolean;
  aiContent: string | null;
  instagramCaptions: { corporate: string, sales: string, warm: string } | null;
  whatsappMessages: { single: string, status: string, investor: string } | null;
  onRegenerate: () => void;
  selectedProperty: Property | null;
}

export const AIContentModal: React.FC<AIContentModalProps> = ({
  aiMarketingType,
  onClose,
  isGenerating,
  aiContent,
  instagramCaptions,
  whatsappMessages,
  onRegenerate,
  selectedProperty
}) => {
  if (!aiMarketingType || aiMarketingType === 'hub') return null;

  const getTitle = () => {
    switch(aiMarketingType) {
      case 'listing': return 'AI İlan Metni';
      case 'instagram': return 'Instagram Captionları';
      case 'whatsapp': return 'WhatsApp Mesajları';
      default: return 'AI İçerik';
    }
  };

  const getIcon = () => {
    switch(aiMarketingType) {
      case 'listing': return <FileText size={24} />;
      case 'instagram': return <Instagram size={24} />;
      case 'whatsapp': return <MessageCircle size={24} />;
      default: return <Sparkles size={24} />;
    }
  };

  const getColor = () => {
    switch(aiMarketingType) {
      case 'listing': return 'bg-blue-600';
      case 'instagram': return 'bg-pink-600';
      case 'whatsapp': return 'bg-emerald-600';
      default: return 'bg-orange-600';
    }
  };

  return (
    <AnimatePresence>
      {(isGenerating || aiContent || instagramCaptions || whatsappMessages) && (
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
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${getColor()} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  {getIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{getTitle()}</h2>
                  <p className="text-xs text-slate-500">Yapay zeka tarafından üretildi</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-slate-100 rounded-full text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {isGenerating ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="text-orange-600"
                >
                  <RefreshCw size={40} />
                </motion.div>
                <p className="text-sm font-medium text-slate-500">İçerik oluşturuluyor...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {aiMarketingType === 'listing' && aiContent && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-auto">
                      {aiContent}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => navigator.clipboard.writeText(aiContent)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Copy size={16} /> Kopyala
                      </button>
                      <button onClick={onRegenerate} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                    </div>
                  </div>
                )}

                {aiMarketingType === 'instagram' && instagramCaptions && (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {['corporate', 'sales', 'warm'].map((type) => (
                        <button key={type} className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 whitespace-nowrap uppercase tracking-wider">
                          {type === 'corporate' ? 'Kurumsal' : type === 'sales' ? 'Satış Odaklı' : 'Samimi'}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-auto">
                      {instagramCaptions.corporate}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => navigator.clipboard.writeText(instagramCaptions.corporate)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Copy size={16} /> Kopyala
                      </button>
                      <button onClick={onRegenerate} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                    </div>
                  </div>
                )}

                {aiMarketingType === 'whatsapp' && whatsappMessages && (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {['single', 'status', 'investor'].map((type) => (
                        <button key={type} className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-600 whitespace-nowrap uppercase tracking-wider">
                          {type === 'single' ? 'Tekli' : type === 'status' ? 'Durum' : 'Yatırımcı'}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-auto">
                      {whatsappMessages.single}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => navigator.clipboard.writeText(whatsappMessages.single)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Copy size={16} /> Kopyala
                      </button>
                      <button onClick={onRegenerate} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
