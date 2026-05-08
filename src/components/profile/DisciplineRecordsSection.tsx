import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { disciplineRecordsService } from '../../services/disciplineRecordsService';
import { Loader2, Calendar, Target, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { countClosedDaysInRange, getLastClosureDate, extractTopBlockers, countCampaignReflections } from '../../utils/disciplineRecordsHelpers';

export const DisciplineRecordsSection: React.FC = () => {
  const { data: records, isLoading, isError } = useQuery({
    queryKey: ['discipline-records'],
    queryFn: () => disciplineRecordsService.fetchMyDisciplineRecords(30)
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-red-100 flex flex-col items-center text-center">
        <ShieldAlert className="text-red-400 mb-2" size={32} />
        <h3 className="font-bold text-slate-800">Kayıtlar Yüklenemedi</h3>
        <p className="text-slate-500 text-sm mt-1">Disiplin kayıtlarınızı alırken bir sorun oluştu.</p>
      </div>
    );
  }

  const hasRecords = records && records.length > 0;

  if (!hasRecords) {
    return (
      <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center">
        <Calendar className="mx-auto text-slate-300 mb-3" size={32} />
        <h3 className="text-sm font-bold text-slate-600">Henüz disiplin kaydın yok</h3>
        <p className="text-xs text-slate-500 mt-2">
          Günü Mühürle ekranını kullandıkça, çalışma ritmini ve gelişimini buradan takip edebilirsin.
        </p>
      </div>
    );
  }

  const closedLast7 = countClosedDaysInRange(records, 7);
  const closedLast30 = countClosedDaysInRange(records, 30);
  const lastClosure = getLastClosureDate(records);
  const topBlocker = extractTopBlockers(records);
  const reflectionCount = countCampaignReflections(records);

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 justify-between flex flex-col border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-xs">
            <Target size={14} className="text-slate-400" /> Toplam Kapanış
          </div>
          <div className="text-2xl font-black text-slate-800">{records.length} <span className="text-xs font-medium text-slate-400 leading-none">gün</span></div>
        </div>
        <div className="bg-white p-4 justify-between flex flex-col border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-xs">
            <Calendar size={14} className="text-slate-400" /> Son 7 Gün
          </div>
          <div className="text-2xl font-black text-slate-800">{closedLast7} <span className="text-xs font-medium text-slate-400 leading-none">gün</span></div>
        </div>
        <div className="bg-white p-4 justify-between flex flex-col border border-slate-200 rounded-2xl sm:col-span-2">
          <div className="flex items-center gap-2 mb-1 text-slate-500 font-bold text-xs">
            <ShieldAlert size={14} className="text-red-400" /> En Sık Tekrar Eden Engel
          </div>
          <div className="text-sm font-semibold text-slate-800 leading-tight">
            {topBlocker}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {records.map(record => (
          <div key={record.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-bold text-lg text-slate-800">
                  {new Date(record.closure_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                {record.early_close_reason && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">Erken Kapanış</span>
                )}
                {record.campaign_day ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-orange-100 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Award size={10} /> Kamp {record.campaign_day}. Gün
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {record.wins && (
                 <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                    <div className="text-xs font-bold text-emerald-800/60 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Günün Kazancı
                    </div>
                    <p className="text-sm font-medium text-emerald-950">{record.wins}</p>
                 </div>
               )}
               {record.blockers && (
                 <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100/50">
                    <div className="text-xs font-bold text-rose-800/60 uppercase tracking-widest mb-1">Karşılaşılan Engel</div>
                    <p className="text-sm font-medium text-rose-950">{record.blockers}</p>
                 </div>
               )}
            </div>

            {record.tomorrow_top3 && record.tomorrow_top3.length > 0 && record.tomorrow_top3[0].trim() !== '' && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Yarınki Odak</div>
                 <p className="text-sm text-slate-700 font-medium">{record.tomorrow_top3[0]}</p>
              </div>
            )}

            {record.campaign_focus_reflection && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 border-l-4 border-l-orange-500">
                 <div className="flex justify-between items-center mb-2">
                    <div className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest">Kamp Yansıması</div>
                    {record.discipline_score && (
                       <div className="text-[10px] font-bold bg-white text-orange-700 px-2 py-0.5 rounded shadow-sm">
                         Disiplin: {record.discipline_score}/5
                       </div>
                    )}
                 </div>
                 <p className="text-sm font-medium text-slate-800">{record.campaign_focus_reflection}</p>
              </div>
            )}

            {record.early_close_reason && (
               <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                  <span className="font-bold text-slate-700">Erken kapanış nedeni: </span>
                  {record.early_close_reason}
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
