import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Sparkles, ArrowLeft, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import { WhatsAppAnalysisPanel } from './WhatsAppAnalysisPanel';

export const WhatsAppAnalysisPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Analizi</h1>
              <p className="text-slate-500 text-xs font-medium">AI destekli CRM asistanı.</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <MessageSquare size={24} />
          </div>
        </header>

        {/* Feature Highlights */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center space-y-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mx-auto">
              <Zap size={16} />
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Hızlı Analiz</div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mx-auto">
              <TrendingUp size={16} />
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Sıcaklık Skoru</div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center space-y-2">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mx-auto">
              <ShieldCheck size={16} />
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Güvenli Veri</div>
          </div>
        </section>

        {/* Main Panel */}
        <WhatsAppAnalysisPanel />

        {/* Info Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden"
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Nasıl Çalışır?</span>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              WhatsApp konuşmasını kopyalayıp yukarıdaki alana yapıştırın. AI, konuşmadaki müşteri niyetini, bütçesini ve aciliyetini analiz ederek size en doğru CRM aksiyonlarını önerecektir.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        </motion.div>
      </div>
    </div>
  );
};
