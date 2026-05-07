import React, { useState, useEffect } from 'react';
import { adminUserActivityService, AdminUserActivityResponse } from '../../services/adminUserActivityService';
import { 
  Activity, Clock, Briefcase, Zap, Target, Ticket, CheckCircle2, 
  AlertTriangle, AlertOctagon, Eye, UserPlus, FileText, ChevronDown, ChevronUp, History
} from 'lucide-react';

export const AdminUserActivitySection: React.FC<{ userId: string }> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminUserActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const result = await adminUserActivityService.getAdminUserActivity(userId);
        if (mounted) setData(result);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchActivity();
    return () => { mounted = false; };
  }, [userId]);

  if (loading && !data) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
        <Activity className="animate-spin mb-4" size={24} />
        <span className="text-sm font-medium">Aktivite geçmişi ve churn analizi yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm font-medium flex gap-3 items-center">
        <AlertTriangle size={18} />
        Aktivite geçmişi yüklenemedi: {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeline } = data;

  const getRiskBadgeInfo = (level: string) => {
    switch(level) {
      case 'critical': return { icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', label: 'KRİTİK RİSK (CHURN)' };
      case 'risk': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-100', label: 'RİSKLİ' };
      case 'watch': return { icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'İZLEMEDE' };
      case 'healthy': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', label: 'SAĞLIKLI AKTİF' };
      default: return { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100', label: 'BİLİNMİYOR' };
    }
  };

  const getTimelineIcon = (type: string) => {
    switch(type) {
        case 'account_created': return { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' };
        case 'property_created': return { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50' };
        case 'lead_created': return { icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' };
        case 'ai_used': return { icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' };
        case 'package_request_created': return { icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' };
        case 'campaign_started': return { icon: Target, color: 'text-teal-500', bg: 'bg-teal-50' };
        case 'support_ticket_created': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' };
        default: return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const riskInfo = getRiskBadgeInfo(summary.churnRiskLevel);
  const RiskIcon = riskInfo.icon;

  return (
    <div className="space-y-4 mt-6 border-t border-slate-200 pt-6">
      <h4 className="font-bold text-slate-900 flex items-center gap-2">
        <Activity size={18} className="text-indigo-500" />
        Kullanıcı Aktivite Analizi & Churn Radarı
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Card */}
        <div className={`rounded-2xl p-5 border ${riskInfo.bg}`}>
           <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Kullanım Riski (Churn)</h5>
           
           <div className={`flex items-center gap-2 ${riskInfo.color} font-black text-lg mb-4`}>
             <RiskIcon size={22} />
             {riskInfo.label}
           </div>

           <div className="mb-4">
             <div className="flex justify-between text-xs font-bold mb-1">
               <span className="text-slate-600">Kullanım Skoru</span>
               <span className="text-indigo-600">{summary.usageScore} / 100</span>
             </div>
             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, summary.usageScore))}%`}} />
             </div>
           </div>

           <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 uppercase">Risk Faktörleri:</div>
              {summary.churnRiskReasons.length > 0 ? (
                 <ul className="text-[11px] font-medium text-slate-700 space-y-1 list-disc pl-4">
                    {summary.churnRiskReasons.map((r, i) => <li key={i}>{r}</li>)}
                 </ul>
              ) : (
                <div className="text-[11px] font-medium text-slate-500 italic">Saptanan risk faktörü yok.</div>
              )}
           </div>
        </div>

        {/* Overview Stats Mini Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
           <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Hesap Özeti</h5>
           <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
             <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px]">
               <span className="text-slate-500">Hesap Yaşı:</span>
               <span className="font-bold text-slate-800">{summary.accountAgeDays} gün</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px]">
               <span className="text-slate-500">Son Aktiflik:</span>
               <span className="font-bold text-slate-800">{summary.daysSinceLastActive === 0 ? 'Bugün' : `${summary.daysSinceLastActive} gün önce`}</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px]">
               <span className="text-slate-500">Portföy / Lead:</span>
               <span className="font-bold text-slate-800">{summary.propertiesCount} / {summary.leadsCount}</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px]">
               <span className="text-slate-500">AI İstek / Token:</span>
               <span className="font-bold text-slate-800">{summary.aiRequestsCount} / {summary.aiTokensUsed.toLocaleString()}</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px]">
               <span className="text-slate-500">Paket Talebi:</span>
               <span className="font-bold text-slate-800">{summary.packageRequestsCount}</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-1 text-[11px]">
               <span className="text-slate-500">90 Gün Kampı:</span>
               <span className="font-bold text-slate-800">{summary.campaignCurrentDay > 0 ? `${summary.campaignCurrentDay}. Gün` : 'Yok'}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h5 className="text-sm font-bold text-slate-800">Son Hareketler (Timeline)</h5>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{timeline.length} Kayıt</span>
          </div>
          <button className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {isExpanded && (
           timeline.length === 0 ? (
             <div className="text-center text-sm text-slate-500 py-8 italic bg-slate-50 rounded-xl">
               Bu kullanıcı için henüz detaylı aktivite kaydı saptanmadı.
             </div>
           ) : (
             <div className="relative border-l-2 border-slate-100 ml-4 pl-6 pb-4 space-y-6 mt-6">
                {timeline.map((event, index) => {
                   const tIcon = getTimelineIcon(event.type);
                   const Icon = tIcon.icon;
                   return (
                     <div key={`${event.id}-${index}`} className="relative">
                       <div className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full border-4 border-white ${tIcon.bg} ${tIcon.color} flex items-center justify-center shadow-sm`}>
                         <Icon size={14} />
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-sm text-slate-800">{event.title}</span>
                           <span className="text-[10px] text-slate-400 flex items-center gap-1">
                             <Clock size={10} />
                             {new Date(event.created_at).toLocaleString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                           </span>
                           {event.severity && (
                             <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                               event.severity === 'success' ? 'bg-emerald-100 text-emerald-700' :
                               event.severity === 'danger' ? 'bg-rose-100 text-rose-700' :
                               event.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                               'bg-slate-100 text-slate-600'
                             }`}>
                               {event.severity}
                             </span>
                           )}
                         </div>
                         <p className="text-xs text-slate-600 font-medium">
                           {event.description}
                         </p>
                       </div>
                     </div>
                   );
                })}
             </div>
           )
        )}
      </div>

    </div>
  );
};
