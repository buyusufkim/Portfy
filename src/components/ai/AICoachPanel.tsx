import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  Lock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAICoach } from '../../hooks/useAICoach';
import { AICoachAction } from '../../types/ai';

export const AICoachPanel: React.FC = () => {
  // isPremium değişkenini buradan çıkardık çünkü artık global PremiumGate kullanıyoruz
  const { insight, isLoading, error, refetch, convertToTask, isConverting } = useAICoach();

  // 🔥 ESKİ "LEVEL 2" KİLİT EKRANI BURADAN TAMAMEN SİLİNDİ 🔥

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-white rounded-[40px] animate-pulse border border-slate-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-white rounded-[32px] animate-pulse border border-slate-100" />
          <div className="h-32 bg-white rounded-[32px] animate-pulse border border-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center bg-red-50 border border-red-100 rounded-[40px] space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mx-auto">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-red-900">Bir Hata Oluştu</h4>
          <p className="text-sm text-red-700 font-medium">AI Koç şu an ulaşılamıyor.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={14} /> Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Morning Briefing */}
      <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500">AI Koç Briefing</span>
            </div>
            <div className="text-2xl font-black text-white/20">#{insight?.score}</div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-tight tracking-tight">
              {insight?.briefing}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {insight?.performance_evaluation}
            </p>
          </div>
          {insight?.is_rescue_mode_recommended && (
            <div className="bg-orange-600/20 border border-orange-600/30 p-4 rounded-2xl flex items-center gap-3">
              <Zap size={20} className="text-orange-500 fill-orange-500" />
              <p className="text-xs font-bold text-orange-100">Rescue Mode Öneriliyor: Günü kurtarmak için hala vaktin var!</p>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
      </section>

      {/* Strategic Actions */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Stratejik Aksiyonlar</h3>
          <button 
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-orange-600 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {insight?.actions.map((action, index) => (
              <CoachActionCard 
                key={action.id} 
                action={action} 
                index={index} 
                onConvertToTask={() => convertToTask(action)}
                isConverting={isConverting}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Warnings */}
      {insight?.warnings && insight.warnings.length > 0 && (
        <section className="bg-red-50 border border-red-100 p-6 rounded-[32px] space-y-4">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
            <AlertCircle size={16} />
            Kritik Uyarılar
          </div>
          <ul className="space-y-2">
            {insight.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-red-900 font-medium flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
};

const CoachActionCard: React.FC<{ 
  action: AICoachAction, 
  index: number, 
  onConvertToTask: () => void,
  isConverting: boolean
}> = ({ action, index, onConvertToTask, isConverting }) => {
  const icons = {
    call: <Phone size={20} />,
    visit: <MapPin size={20} />,
    followup: <Calendar size={20} />,
    update: <RefreshCw size={20} />,
    rescue: <Zap size={20} />
  };

  const colors = {
    high: 'bg-orange-50 text-orange-600 border-orange-100',
    medium: 'bg-blue-50 text-blue-600 border-blue-100',
    low: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-6 rounded-[32px] border ${colors[action.priority]} flex flex-col justify-between gap-6 group hover:shadow-lg transition-all`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.priority === 'high' ? 'bg-orange-100' : 'bg-white'} shadow-sm`}>
            {icons[action.type]}
          </div>
          <div className="px-2 py-0.5 bg-white/50 rounded-lg text-[8px] font-black uppercase tracking-wider">
            +{action.points} XP
          </div>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">{action.title}</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">{action.description}</p>
        </div>
      </div>
      <button 
        onClick={onConvertToTask}
        disabled={isConverting}
        className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all"
      >
        <Plus size={14} /> Göreve Çevir
      </button>
    </motion.div>
  );
};