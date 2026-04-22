import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Property, MarketIntelligenceReport } from '../../types';
import { Card, Badge, Skeleton } from '../UI';
import { 
  Radar, TrendingDown, TrendingUp, Minus, 
  MapPin, Clock, ExternalLink, Sparkles, 
  AlertCircle, ChevronRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompetitorRadarProps {
  property: Property;
}

export const CompetitorRadar: React.FC<CompetitorRadarProps> = ({ property }) => {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['competitor-pulse', property.id],
    queryFn: () => api.getCompetitorPulse(property),
    staleTime: 1000 * 60 * 60, // 1 saat
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card className="p-8 text-center bg-red-50 border-red-100">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
        <h4 className="text-sm font-bold text-red-900">Analiz Alınamadı</h4>
        <p className="text-xs text-red-700">Piyasa istihbaratı şu an çekilemiyor. Lütfen daha sonra tekrar deneyin.</p>
      </Card>
    );
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'price_drop': return <TrendingDown size={14} className="text-emerald-500" />;
      case 'new_listing': return <TrendingUp size={14} className="text-orange-500" />;
      case 'sold_or_removed': return <Minus size={14} className="text-slate-400" />;
      default: return null;
    }
  };

  const getChangeLabel = (type: string) => {
    switch (type) {
      case 'price_drop': return 'Fiyat Düştü';
      case 'new_listing': return 'Yeni İlan';
      case 'sold_or_removed': return 'Satıldı/Kaldırıldı';
      default: return 'Güncellendi';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'heating': return 'bg-orange-500';
      case 'cooling': return 'bg-blue-500';
      default: return 'bg-emerald-500';
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'heating': return 'Piyasa Isınıyor';
      case 'cooling': return 'Piyasa Soğuyor';
      default: return 'Piyasa Stabil';
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Özet Kartı */}
      <Card className="p-6 bg-slate-900 text-white border-none relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Haftalık Piyasa İstihbaratı</span>
            </div>
            <Badge variant="info" className={`${getMoodColor(report.market_mood)} border-none text-white text-[10px]`}>
              {getMoodLabel(report.market_mood)}
            </Badge>
          </div>
          
          <h3 className="text-lg font-bold leading-tight">{report.summary}</h3>
          
          <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Info size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Satış Argümanı (Strateji)</p>
                <p className="text-xs text-slate-200 mt-1 italic leading-relaxed">
                  "{report.action_tip}"
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
      </Card>

      {/* Rakip İlanlar Listesi */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-sm font-bold text-slate-900">Bölgedeki Hareketlilik (Son 7 Gün)</h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{report.competitors.length} Yeni Hareket</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {report.competitors.map((comp, idx) => (
              <motion.div
                key={comp.id || idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 bg-white hover:shadow-md transition-shadow cursor-default group border-slate-100">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getChangeIcon(comp.change_type)}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          comp.change_type === 'price_drop' ? 'text-emerald-600' : 
                          comp.change_type === 'new_listing' ? 'text-orange-600' : 'text-slate-500'
                        }`}>
                          {getChangeLabel(comp.change_type)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{comp.date}</span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{comp.title}</h5>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <MapPin size={10} />
                          {comp.location}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Clock size={10} />
                          {comp.distance}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div>
                        {comp.old_price && (
                          <div className="text-[10px] text-slate-400 line-through">₺{comp.old_price.toLocaleString()}</div>
                        )}
                        <div className="text-sm font-black text-slate-900">₺{comp.price.toLocaleString()}</div>
                      </div>
                      {comp.url && (
                        <a 
                          href={comp.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Analiz Tarihi: {new Date(report.created_at).toLocaleDateString('tr-TR')}
        </p>
      </div>
    </div>
  );
};
