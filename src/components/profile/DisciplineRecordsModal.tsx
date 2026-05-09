import React, { useState, useMemo } from 'react';
import { DayClosure } from '../../types';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Award, Clock } from 'lucide-react';
import { buildCalendarDaysForMonth, getRecordForDate, hasCampaignReflectionForDate, countClosedDaysInRange, extractTopBlockers, formatWorkTimeRange, formatWorkDuration } from '../../utils/disciplineRecordsHelpers';

interface DisciplineRecordsModalProps {
  records: DayClosure[];
  onClose: () => void;
}

export const DisciplineRecordsModal: React.FC<DisciplineRecordsModalProps> = ({ records, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const calendarDays = useMemo(() => buildCalendarDaysForMonth(year, month), [year, month]);

  const selectedRecord = selectedDate ? getRecordForDate(records, selectedDate) : undefined;

  const closedLast7 = countClosedDaysInRange(records, 7);
  const closedLast30 = countClosedDaysInRange(records, 30);
  const topBlocker = extractTopBlockers(records);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Disiplin Kayıtları</h2>
            <p className="text-sm text-slate-500">Gün kapatma kayıtlarını takvim üzerinden inceleyebilirsin.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Sol: Takvim ve Özet */}
          <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-6">
            
            {/* Küçük Özet */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Toplam Kapanış</div>
                <div className="text-lg font-black text-slate-800">{records.length} <span className="text-xs font-medium text-slate-400">gün</span></div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Son 30 Gün</div>
                <div className="text-lg font-black text-slate-800">{closedLast30} <span className="text-xs font-medium text-slate-400">gün</span></div>
              </div>
            </div>

            {/* Takvim */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                  <ChevronLeft size={20} />
                </button>
                <div className="font-bold text-slate-800">
                  {monthNames[month]} {year}
                </div>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, ix) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const record = getRecordForDate(records, day);
                  const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();
                  const isToday = new Date().toDateString() === day.toDateString();
                  const hasCampaign = record ? hasCampaignReflectionForDate(records, day) : false;

                  return (
                    <button
                      key={ix}
                      onClick={() => setSelectedDate(day)}
                      disabled={!isCurrentMonth}
                      className={`
                        relative w-full aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                        ${!isCurrentMonth ? 'text-slate-300 opacity-50' : 'text-slate-700 hover:bg-slate-50'}
                        ${isSelected && isCurrentMonth ? 'ring-2 ring-indigo-500 bg-indigo-50 font-bold' : ''}
                        ${isToday && !isSelected ? 'font-bold text-indigo-600' : ''}
                      `}
                    >
                      {day.getDate()}
                      {record && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          <span className={`w-1 h-1 rounded-full ${hasCampaign ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Alt uyarı/info */}
            <div className="mt-auto">
               <div className="flex gap-4 text-[10px] font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 justify-center">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Gün Kapatıldı</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Kamp Yansıması</div>
               </div>
            </div>

          </div>

          {/* Sağ: Seçili Gün Detayı */}
          <div className="w-full md:w-1/2 p-6 bg-slate-50/50 flex flex-col gap-4">
            
            {!selectedDate ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                  <p>Detaylarını görmek için takvimden bir gün seçin.</p>
               </div>
            ) : !selectedRecord ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg font-bold text-slate-700 mb-2">
                    {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 w-full">
                     <p className="text-sm text-slate-500">Bu gün için disiplin kaydı yok.</p>
                  </div>
                </div>
            ) : (
               <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                     <h3 className="text-xl font-bold text-slate-800">
                       {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                     </h3>
                     {selectedRecord.campaign_day ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-orange-100 border border-orange-200 text-orange-700 px-2 py-1 rounded flex items-center gap-1">
                          <Award size={12} /> Kamp {selectedRecord.campaign_day}. Gün
                        </span>
                     ) : null}
                  </div>

                  { (selectedRecord.day_started_at || selectedRecord.day_closed_at) && (
                     <div className="flex items-center gap-4 bg-white rounded-xl p-3 border border-slate-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                           <Clock size={16} className="text-slate-400" />
                           {formatWorkTimeRange(selectedRecord)}
                        </div>
                        {selectedRecord.work_duration_minutes != null && (
                           <div className="text-sm font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded">
                              {formatWorkDuration(selectedRecord.work_duration_minutes)} mesai
                           </div>
                        )}
                     </div>
                  )}

                  {selectedRecord.wins && (
                     <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Günün Kazancı
                        </div>
                        <p className="text-sm font-medium text-emerald-950 mt-1">{selectedRecord.wins}</p>
                     </div>
                   )}
                   
                   {selectedRecord.blockers && (
                     <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                        <div className="text-xs font-bold text-rose-800 uppercase tracking-widest mb-1">Karşılaşılan Engel</div>
                        <p className="text-sm font-medium text-rose-950 mt-1">{selectedRecord.blockers}</p>
                     </div>
                   )}
                   
                   {selectedRecord.tomorrow_top3 && selectedRecord.tomorrow_top3.length > 0 && selectedRecord.tomorrow_top3[0].trim() !== '' && (
                      <div className="bg-white border text-sm border-slate-200 rounded-xl p-4">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Yarınki Odak</div>
                         <p className="text-slate-800 font-medium">{selectedRecord.tomorrow_top3[0]}</p>
                      </div>
                   )}

                   {selectedRecord.campaign_focus_reflection && (
                      <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 border-l-4 border-l-orange-500">
                         <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] font-bold text-orange-600/70 uppercase tracking-widest">Kamp Yansıması</div>
                            {selectedRecord.discipline_score && (
                               <div className="text-[10px] font-bold bg-white text-orange-700 px-2 py-0.5 rounded shadow-sm">
                                 Disiplin: {selectedRecord.discipline_score}/5
                               </div>
                            )}
                         </div>
                         <p className="text-sm font-medium text-slate-800">{selectedRecord.campaign_focus_reflection}</p>
                      </div>
                   )}

                   {selectedRecord.early_close_reason && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm">
                         <span className="font-bold text-amber-800 block text-xs uppercase tracking-widest mb-1">Erken kapanış nedeni</span>
                         <span className="text-amber-950 font-medium">{selectedRecord.early_close_reason}</span>
                      </div>
                   )}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
