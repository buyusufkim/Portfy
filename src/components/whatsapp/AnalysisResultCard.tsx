import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  TrendingUp, 
  Zap, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  MapPin, 
  Home, 
  Target,
  Plus,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { WhatsAppAnalysis } from '../../types/whatsapp';
import { useWhatsAppAnalysis } from '../../hooks/useWhatsAppAnalysis';

interface AnalysisResultCardProps {
  result: WhatsAppAnalysis;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ result }) => {
  const { addToCRM, isAddingToCRM, createFollowUp, isCreatingFollowUp } = useWhatsAppAnalysis();

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'Kritik': return 'bg-red-100 text-red-600 border-red-200';
      case 'Yüksek': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Orta': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <User size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{result.customerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getInterestColor(result.interestLevel)}`}>
                  {result.interestLevel} İlgi
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                  {result.customerType}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-600">%{result.hotnessScore}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sıcaklık Skoru</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
              <Zap size={14} className="fill-emerald-600" /> Aciliyet
            </div>
            <p className="text-sm text-slate-900 font-bold leading-relaxed">{result.urgency}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
              <DollarSign size={14} /> Bütçe Sinyali
            </div>
            <p className="text-sm text-slate-900 font-bold leading-relaxed">{result.budgetSignal}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <Target size={14} /> Önerilen Aksiyon
          </div>
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] space-y-2">
            <p className="text-sm text-emerald-900 font-bold leading-relaxed">{result.suggestedAction}</p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <Calendar size={14} /> Takip Tarihi: {new Date(result.followUpDate).toLocaleDateString('tr-TR')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasyon Tercihi</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <MapPin size={14} className="text-slate-400" /> {result.extractedDetails.locationPreference || 'Belirtilmedi'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mülk Tipi</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <Home size={14} className="text-slate-400" /> {result.extractedDetails.propertyType || 'Belirtilmedi'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-4">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> AI Güven Skoru: %{result.confidenceScore}
          </div>
          <div>{new Date().toLocaleDateString('tr-TR')}</div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => addToCRM(result)}
          disabled={isAddingToCRM}
          className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
        >
          {isAddingToCRM ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Plus size={20} />
          )}
          CRM'e Müşteri Olarak Ekle
        </button>
        <button
          onClick={() => createFollowUp(result)}
          disabled={isCreatingFollowUp}
          className="w-full py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[24px] font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {isCreatingFollowUp ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Calendar size={20} />
          )}
          Takip Görevi Oluştur
        </button>
      </div>
    </div>
  );
};
