import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, BarChart3 } from 'lucide-react';
import { Card } from '../UI';
import { UserProfile, Property } from '../../types';
import { api } from '../../services/api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useRevenueStats } from '../../hooks/useRevenueStats';

interface CRMFinanceTabProps {
  profile?: UserProfile | null;
  properties?: Property[];
}

export const CRMFinanceTab: React.FC<CRMFinanceTabProps> = ({ profile, properties = [] }) => {
  const { data: revenueStats, isLoading: revenueLoading } = useRevenueStats();

  const { data: gamifiedStats } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.id],
    queryFn: () => api.getGamifiedStats(),
    enabled: !!profile?.id
  });

  const { data: weeklyReports = [] } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_WEEKLY_REPORTS, profile?.id],
    queryFn: () => api.momentumOs.getWeeklyReports(),
    enabled: !!profile?.id
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const isEst = !(revenueStats && (revenueStats.total_pipeline_value !== undefined || revenueStats.weighted_revenue !== undefined));
  const rvPotential = revenueStats?.total_pipeline_value ?? properties.filter(p => p.status === 'Yayında').reduce((acc, p) => acc + ((p.price || 0) * 0.02), 0);
  const rvExpected = revenueStats?.weighted_revenue ?? Math.round(rvPotential * 0.6);
  const rvOffer = Math.round(rvPotential * 0.3);
  const rvClosed = Math.round(rvPotential * 0.4);
  const rvMax = Math.max(1, rvPotential, rvExpected, rvOffer, rvClosed);

  const hasMomentumData = weeklyReports?.[0]?.metrics?.performance_score !== undefined || gamifiedStats?.streak;
  const momentumScore = (weeklyReports?.[0]?.metrics?.performance_score as number) ?? (gamifiedStats?.streak ? Math.min(100, Math.round((gamifiedStats.streak / 7) * 100)) : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GELİR ÖZETİ */}
        <section>
          <Card className="p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Gelir Özeti</h3>
              <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 outline-none">
                <option>Bu Ay</option>
              </select>
            </div>
            <div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[28px] font-black text-slate-900 leading-none">
                  {formatCurrency(rvPotential).replace('₺', '')} <span className="text-xl">₺</span>
                </span>
                <span className="text-xs font-bold text-emerald-500 flex items-center mb-1">
                  <ArrowUpRight size={12} />
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">
                  {rvPotential === 0 ? "Gelir Verisi Yok" : (isEst ? "Tahmini Potansiyel Gelir" : "Toplam Potansiyel Gelir")}
                </span>
                <span className="text-[9px] text-slate-400">
                  {isEst && rvPotential > 0 ? "Portföylerden tahmini" : ""}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">{isEst ? "Tahmini Potansiyel" : "Potansiyel"}</span>
                  <span className="text-slate-900">{formatCurrency(rvPotential)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800" style={{ width: `${Math.min(100, (rvPotential / rvMax) * 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">{isEst ? "Tahmini Görüşme" : "Görüşme/Ağırlıklı"}</span>
                  <span className="text-slate-900">{formatCurrency(rvExpected)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D2B4]" style={{ width: `${Math.min(100, (rvExpected / rvMax) * 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">{isEst ? "Tahmini Teklif" : "Teklif"}</span>
                  <span className="text-slate-900">{formatCurrency(rvOffer)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF6B1A]" style={{ width: `${Math.min(100, (rvOffer / rvMax) * 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600">{isEst ? "Tahmini Kapanan" : "Kapanan"}</span>
                  <span className="text-slate-900">{formatCurrency(rvClosed)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (rvClosed / rvMax) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* HAFTALIK MOMENTUM */}
        <section>
          <Card className="p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Haftalık Momentum</h3>
              </div>
              <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 outline-none">
                <option>Bu Hafta</option>
              </select>
            </div>
            
            <div className="flex gap-4 items-end mt-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 stroke-current"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={hasMomentumData ? "text-[#00D2B4] stroke-current" : "text-slate-200 stroke-current"}
                    strokeWidth="3"
                    strokeDasharray={`${hasMomentumData ? momentumScore : 0}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                  <span className="text-xl font-black text-slate-900">{hasMomentumData ? momentumScore : 0}%</span>
                  <span className="text-[6px] uppercase font-bold text-slate-400">Momentum Skoru</span>
                </div>
              </div>

              <div className="flex-1 flex items-end justify-between h-14 w-full px-1 border-b border-dashed border-slate-200 relative pb-1">
                <div className="absolute top-0 right-0 left-0 border-t border-dashed border-slate-200 pointer-events-none">
                  <span className="absolute -top-3 right-0 text-[8px] font-bold text-slate-400">Hedef 85%</span>
                </div>
                {hasMomentumData ? (
                  <>
                    <div className="w-2 h-[30%] bg-slate-200 rounded-t-sm" />
                    <div className="w-2 h-[60%] bg-slate-200 rounded-t-sm" />
                    <div className="w-2 h-[80%] bg-slate-200 rounded-t-sm" />
                    <div className="w-2 h-[100%] bg-[#00D2B4] rounded-t-sm" />
                    <div className="w-2 h-[50%] bg-slate-200 rounded-t-sm" />
                    <div className="w-2 h-[40%] bg-slate-200 rounded-t-sm" />
                    <div className="w-2 h-[20%] bg-slate-200 rounded-t-sm" />
                  </>
                ) : (
                  <>
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                    <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-between pl-[5.5rem] pr-1 mt-1">
              <span className="text-[8px] font-bold text-slate-400">Pzt</span>
              <span className="text-[8px] font-bold text-slate-400">Sal</span>
              <span className="text-[8px] font-bold text-slate-400">Çar</span>
              <span className="text-[8px] font-bold text-slate-400">Per</span>
              <span className="text-[8px] font-bold text-slate-400">Cum</span>
              <span className="text-[8px] font-bold text-slate-400">Cmt</span>
              <span className="text-[8px] font-bold text-slate-400">Paz</span>
            </div>

            {!hasMomentumData && (
              <div className="mt-4 text-center">
                <span className="text-xs font-medium text-slate-500">Henüz momentum verisi yok</span>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
};
