import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Wallet, Target, AlertTriangle, ArrowUpRight, Clock } from 'lucide-react';
import { RevenueStats } from '../../types/revenue';
import { formatCurrency } from '../../lib/revenueUtils';

interface RevenueOverviewProps {
  stats: RevenueStats;
  loading?: boolean;
}

export const RevenueOverview: React.FC<RevenueOverviewProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[32px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Potential Commission Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20"
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Potansiyel Kazanç
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight">
                {formatCurrency(stats.potential_commission)}
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                Aktif portföylerden beklenen toplam komisyon
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        </motion.div>

        {/* Weighted Revenue Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <TrendingUp size={24} />
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Gerçekleşme İhtimali
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stats.weighted_revenue)}
              </h2>
              <p className="text-slate-500 text-xs font-medium">
                Aşamaya göre ağırlıklandırılmış tahmini gelir
              </p>
            </div>
          </div>
        </motion.div>

        {/* Today's Opportunity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-orange-50 rounded-[40px] p-8 border border-orange-100 shadow-xl shadow-orange-100/50"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <Target size={24} />
              </div>
              <div className="px-3 py-1 bg-orange-200/50 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Bugünkü Fırsat
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-orange-900 tracking-tight">
                {formatCurrency(stats.today_opportunity)}
              </h2>
              <p className="text-orange-700/70 text-xs font-medium">
                Pazarlık aşamasındaki mülklerin toplam değeri
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Risk and Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-100 p-6 rounded-[32px] flex items-center gap-6">
          <div className="w-16 h-16 bg-red-100 rounded-[24px] flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-red-900">Takipsizlik Riski</h4>
            <p className="text-sm text-red-700 font-medium">
              <span className="font-black">{stats.untracked_risk_count} müşteri</span> 3 gündür aranmadı. Potansiyel kayıp kapıda!
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-6 rounded-[32px] flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-200 rounded-[24px] flex items-center justify-center text-slate-500 shrink-0">
            <Clock size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900">Kaçan Fırsatlar</h4>
            <p className="text-sm text-slate-500 font-medium">
              Son 30 günde <span className="font-black">{formatCurrency(stats.missed_opportunities_value)}</span> değerinde fırsat pasife düştü.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
