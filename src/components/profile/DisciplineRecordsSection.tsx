import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { disciplineRecordsService } from '../../services/disciplineRecordsService';
import { Loader2, Calendar, Target, ShieldAlert, ChevronRight, ArrowRight } from 'lucide-react';
import { countClosedDaysInRange, getLastClosureDate, extractTopBlockers, countCampaignReflections, formatDisciplineRecordDate, calculateAverageWorkDuration } from '../../utils/disciplineRecordsHelpers';
import { DisciplineRecordsModal } from './DisciplineRecordsModal';
import { Card } from '../UI';

export const DisciplineRecordsSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: records, isLoading, isError } = useQuery({
    queryKey: ['discipline-records'],
    queryFn: () => disciplineRecordsService.fetchMyDisciplineRecords(30)
  });

  if (isLoading) {
    return (
      <Card className="rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 relative flex justify-center items-center h-[120px]">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-3xl p-5 sm:p-6 shadow-sm border border-red-100 relative flex flex-col items-center justify-center text-center h-[120px]">
        <ShieldAlert className="text-red-400 mb-2" size={24} />
        <h3 className="font-bold text-slate-800 text-sm">Yüklenemedi</h3>
      </Card>
    );
  }

  const hasRecords = records && records.length > 0;
  const closedLast7 = records ? countClosedDaysInRange(records, 7) : 0;
  const lastClosure = records ? getLastClosureDate(records) : null;
  const averageDuration = records ? calculateAverageWorkDuration(records) : null;

  return (
    <>
      <Card 
        onClick={() => setIsModalOpen(true)}
        className="rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 relative cursor-pointer hover:bg-slate-50 transition-colors h-full flex flex-col"
      >
        {/* Header / Mobile Summary */}
        <div className="flex items-center justify-between lg:border-b lg:border-slate-100 lg:pb-3">
          <div className="flex items-center gap-3 lg:gap-2">
            <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Target size={20} className="lg:w-4 lg:h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Disiplin Kayıtları</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Günü Mühürle kayıtlarını ve çalışma ritmini incele.</p>
              <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                {hasRecords && averageDuration ? `Ort. Mesai: ${averageDuration}` : 
                 (hasRecords ? `${closedLast7} kapanış (Son 7 gün)` : 'Henüz kayıt yok')}
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
          <button 
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
            className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            İncele
          </button>
        </div>
        
        {/* Desktop Details */}
        <div className="hidden lg:block mt-4 flex-1">
          <p className="text-[11px] text-slate-500 mb-3">Günü Mühürle kayıtlarını ve çalışma ritmini incele.</p>
          <div className="flex flex-col h-auto">
            {hasRecords ? (
              <div className="space-y-1.5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">Son 7 Gün</span>
                  <span className="text-[11px] font-bold text-slate-700">{closedLast7} Kapanış</span>
                </div>
                {lastClosure && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">Son Kapanış</span>
                    <span className="text-[11px] font-bold text-slate-700">{formatDisciplineRecordDate(lastClosure)}</span>
                  </div>
                )}
                {averageDuration && (
                  <div className="flex flex-col mt-1">
                    <span className="text-[10px] text-slate-400">Ortalama Mesai</span>
                    <span className="text-[11px] font-bold text-slate-700">{averageDuration}</span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 italic block mt-1">Henüz disiplin kaydı yok.</span>
            )}
          </div>
        </div>
      </Card>

      {isModalOpen && records && (
        <DisciplineRecordsModal 
          records={records} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};
