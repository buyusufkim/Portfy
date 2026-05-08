import React, { useState, useEffect } from 'react';
import { X, Loader2, Target, Calendar, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { adminCampaign90Service, AdminCampaignUserDetail } from '../../services/adminCampaign90Service';
import { maskEmail, maskPhone } from '../../utils/masking';

interface Props {
  userId: string;
  onClose: () => void;
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const AdminCampaign90UserDetailModal: React.FC<Props> = ({ userId, onClose, showAdminToast }) => {
  const [detail, setDetail] = useState<AdminCampaignUserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await adminCampaign90Service.getAdminCampaignUserDetail(userId);
        setDetail(data);
      } catch (err: any) {
        showAdminToast('error', 'Hata', err.message);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [userId, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
           <div>
              <h2 className="text-xl font-bold text-slate-800">Kampanya Detayı</h2>
              <p className="text-sm text-slate-500">Danışman kampı ilerleme raporu</p>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
           {loading ? (
             <div className="flex justify-center items-center py-20 text-indigo-500">
                <Loader2 className="w-8 h-8 animate-spin" />
             </div>
           ) : detail ? (
             <div className="space-y-6">
                
                {/* User Info */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                     {detail.display_name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900">{detail.display_name}</h3>
                     <p className="text-sm text-slate-500">{maskEmail(detail.email)} • {maskPhone(detail.phone)}</p>
                   </div>
                   <div className="ml-auto">
                     <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                        detail.campaign_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                     }`}>
                        {detail.campaign_status === 'active' ? 'Aktif' : detail.campaign_status}
                     </span>
                   </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Target size={14}/> Gün</span>
                       <div className="text-2xl font-black text-slate-900">{detail.current_day} <span className="text-sm text-slate-400 font-medium">/ 90</span></div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><CheckCircle2 size={14}/> Progress</span>
                       <div className="text-2xl font-black text-slate-900">%{detail.progress_percent}</div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><CheckCircle2 size={14}/> Görev</span>
                       <div className="text-2xl font-black text-slate-900">%{detail.overall_completion_percent}</div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Calendar size={14}/> Başlangıç</span>
                       <div className="text-sm font-bold text-slate-900 mt-2">{new Date(detail.start_date).toLocaleDateString('tr-TR')}</div>
                    </div>
                </div>

                {/* Risks */}
                {detail.risk_reasons.length > 0 && (
                   <div className={`p-4 rounded-2xl border ${
                      detail.risk_level === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                      detail.risk_level === 'risk' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                      'bg-amber-50 border-amber-200 text-amber-800'
                   }`}>
                      <h4 className="font-bold flex items-center gap-2 mb-2">
                        {detail.risk_level === 'critical' ? <AlertOctagon size={16}/> : <AlertTriangle size={16}/>}
                        Gözlemlenen Riskler
                      </h4>
                      <ul className="text-sm space-y-1 list-disc pl-5 font-medium opacity-90">
                         {detail.risk_reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                   </div>
                )}

                {/* Son Aktiviteler (Skorlar) */}
                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-3 ml-1">Son Kampanya Etkileşimleri</h4>
                   {detail.scores.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500">
                         Henüz aktivite kaydedilmedi.
                      </div>
                   ) : (
                      <div className="space-y-2">
                         {detail.scores.slice(0, 10).map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                               <div className="text-sm font-bold text-slate-700">{new Date(s.score_date).toLocaleDateString('tr-TR')}</div>
                               <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                                  {s.completed_tasks} / {s.total_tasks} Görev 
                                  ({s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks)*100) : 0}%)
                               </div>
                            </div>
                         ))}
                         {detail.scores.length > 10 && (
                            <div className="text-xs text-center text-slate-400 mt-2 font-medium">Son 10 gün gösteriliyor...</div>
                         )}
                      </div>
                   )}
                </div>

             </div>
           ) : (
             <div className="p-6 text-center text-slate-500">Kullanıcı bulunamadı.</div>
           )}
        </div>

      </div>
    </div>
  );
};
