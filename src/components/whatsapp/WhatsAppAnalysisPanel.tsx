import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Lock,
  Send,
  Trash2
} from 'lucide-react';
import { useWhatsAppAnalysis } from '../../hooks/useWhatsAppAnalysis';
import { AnalysisResultCard } from './AnalysisResultCard';

export const WhatsAppAnalysisPanel: React.FC = () => {
  const [text, setText] = useState('');
  const { 
    analyze, 
    isAnalyzing, 
    analysisResult, 
    error, 
    reset, 
    isPremium 
  } = useWhatsAppAnalysis();

  const handleAnalyze = () => {
    if (!text.trim()) return;
    analyze(text);
  };

  const handleClear = () => {
    setText('');
    reset();
  };

  if (!isPremium) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[40px] p-10 text-center space-y-6 border border-slate-800 relative overflow-hidden"
      >
        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">WhatsApp Analizi Kilitli</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              WhatsApp konuşmalarını analiz edip CRM'e otomatik aktarmak için Professional (Level 2) seviyesine ulaşmalısın.
            </p>
          </div>
          <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors">
            Seviye Atla & Kilidi Aç
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">WhatsApp Konuşma Analizi</h3>
            <p className="text-slate-500 text-xs font-medium">Konuşmayı yapıştırın, AI gerisini halletsin.</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="WhatsApp konuşmasını buraya yapıştırın..."
            className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
          {text && (
            <button 
              onClick={handleClear}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !text.trim()}
          className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-bold text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Konuşmayı Analiz Et
            </>
          )}
        </button>
      </section>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs text-red-900 font-medium leading-relaxed">
              Analiz sırasında bir hata oluştu. Lütfen metni kontrol edip tekrar deneyin.
            </p>
          </motion.div>
        )}

        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AnalysisResultCard result={analysisResult} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
