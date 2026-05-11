import React from 'react';
import { Trophy, Activity, Target, ExternalLink, ChevronDown, ChevronLeft, ChevronRight, Lightbulb, BookOpen } from 'lucide-react';
import { Card } from '../UI';
import { Campaign90Stats } from '../../hooks/useCampaign90Stats';

interface StatsProps {
    currentDay: number;
    completedPercent: number;
    todayCompleted: number;
    todayTotal: number;
    todayG: number;
    todayP: number;
    todayA: number;
    todayScore: number;
    cumulativeScore: number;
    dayStatus?: 'active' | 'closed' | 'not_started';
    selectedDay?: number;
    onSelectDay?: (day: number) => void;
}

export const CampaignTopStats: React.FC<StatsProps> = ({
    currentDay,
    completedPercent,
    todayCompleted,
    todayTotal,
    todayG,
    todayP,
    todayA,
    todayScore,
    cumulativeScore,
    dayStatus = 'not_started',
    selectedDay,
    onSelectDay
}) => {
    const displayDay = selectedDay ?? currentDay;
    const canGoBack = displayDay > 1;
    const canGoForward = displayDay < currentDay;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            {/* Header Progress Card */}
            <div className="p-5 bg-slate-900 text-white rounded-[24px] relative overflow-hidden shadow-xl shadow-slate-900/10">
                <div className="absolute -right-4 -top-4 opacity-5">
                   <Trophy size={80} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                          <Trophy size={18} className="text-[#00D2B4]" />
                       </div>
                       <div className="flex-1">
                           <div className="text-[9px] uppercase tracking-widest font-bold text-[#00D2B4] mb-0.5">Portfy Mentor</div>
                           <h2 className="font-bold text-base leading-tight">Kamp İlerlemesi</h2>
                       </div>
                       {onSelectDay && (
                           <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5 border border-white/10">
                               <button 
                                   onClick={() => canGoBack && onSelectDay(displayDay - 1)}
                                   disabled={!canGoBack}
                                   className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                               >
                                   <ChevronLeft size={16} />
                               </button>
                               <select 
                                   value={displayDay}
                                   onChange={(e) => onSelectDay(Number(e.target.value))}
                                   className="bg-transparent text-[13px] font-bold text-white outline-none cursor-pointer appearance-none px-1 text-center"
                               >
                                   {Array.from({length: currentDay}).map((_, i) => (
                                       <option key={i+1} value={i+1} className="text-slate-900">Gün {i+1}</option>
                                   ))}
                               </select>
                               <button 
                                   onClick={() => canGoForward && onSelectDay(displayDay + 1)}
                                   disabled={!canGoForward}
                                   className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                               >
                                   <ChevronRight size={16} />
                               </button>
                           </div>
                       )}
                    </div>

                    <div className="flex justify-between items-end mb-1.5">
                        <div className="text-xs font-bold text-white/80">Gün {displayDay} / 90</div>
                        <div className="text-xs font-black text-[#00D2B4]">{completedPercent}%</div>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-[#00D2B4] rounded-full transition-all duration-1000" style={{ width: `${completedPercent}%` }} />
                    </div>

                    <div className="bg-white/10 p-3 rounded-xl border border-white/20 flex items-center justify-between">
                        <div className="text-[10px] font-bold text-[#00D2B4] tracking-wide">
                            {dayStatus === 'not_started' ? 'BAŞLAMADI' : dayStatus === 'active' ? 'AKTİF' : 'KAPANDI'}
                        </div>
                        <div className="text-[11px] font-bold text-white/80">
                            <span className="text-white font-black">{todayCompleted}</span> / {todayTotal} bitti
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's GPA Card */}
            <Card className="p-5 bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                   <h3 className="font-black text-slate-800 mb-0.5 flex items-center gap-1.5 text-base tracking-tight">
                       <Activity size={16} className="text-[#00D2B4]" /> 
                       Bugünkü GPA
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 mb-3">Günlük hedeflerin durumu</p>
                   
                   <div className="grid grid-cols-3 gap-2">
                       <div className="text-center group">
                           <div className="w-full h-12 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center mb-1 border border-blue-100/50 transition-colors group-hover:bg-blue-50">
                               <span className="text-[9px] font-black text-blue-400/80 uppercase">G</span>
                               <span className="font-black text-blue-600 text-lg leading-none mt-0.5">{todayG}</span>
                           </div>
                       </div>
                       <div className="text-center group">
                           <div className="w-full h-12 bg-purple-50/50 rounded-xl flex flex-col items-center justify-center mb-1 border border-purple-100/50 transition-colors group-hover:bg-purple-50">
                               <span className="text-[9px] font-black text-purple-400/80 uppercase">P</span>
                               <span className="font-black text-purple-600 text-lg leading-none mt-0.5">{todayP}</span>
                           </div>
                       </div>
                       <div className="text-center group">
                           <div className="w-full h-12 bg-orange-50/50 rounded-xl flex flex-col items-center justify-center mb-1 border border-orange-100/50 transition-colors group-hover:bg-orange-50">
                               <span className="text-[9px] font-black text-orange-400/80 uppercase">A</span>
                               <span className="font-black text-orange-600 text-lg leading-none mt-0.5">{todayA}</span>
                           </div>
                       </div>
                   </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-500">Bugünkü Skor</span>
                       <span className="font-black text-slate-800 text-base">{todayScore} Puan</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-bold text-slate-500">Kümülatif Skor</span>
                       <span className="text-[13px] font-bold text-[#00D2B4]">{cumulativeScore} Puan</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const CampaignProfessionalGuides: React.FC = () => {
    return (
        <details className="group [&_summary::-webkit-details-marker]:hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
            <summary className="p-3 md:px-4 md:py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <BookOpen size={16} className="text-indigo-500" /> Mesleki Rehberler
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                        — Alıcı, satıcı, yetki ve portföy süreci ipuçları
                    </p>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
            </summary>
            
            <div className="border-t border-slate-100 flex flex-col divide-y divide-slate-100 bg-slate-50/50 rounded-b-2xl">
                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-[13px] font-bold text-slate-800 block">Alıcı Segmenti Rehberi</h3>
                        <ChevronDown size={16} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-xs text-slate-600 pl-4 space-y-2">
                        <p>Mevcut 'Sıcaklık' ve 'Notlar' alanlarını kullanarak adaylarını segmente et:</p>
                        <ul className="space-y-1.5">
                            <li><strong className="text-emerald-600">A Alıcı:</strong> Bütçesi net, karar süresi yakın, ihtiyaç belirli.</li>
                            <li><strong className="text-blue-600">B Alıcı:</strong> 1-3 ay içinde karar verebilir, takip ister.</li>
                            <li><strong className="text-slate-500">C Alıcı:</strong> Araştırma aşamasında, düşük öncelik.</li>
                        </ul>
                        <div className="bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 mt-2 flex gap-1.5 items-start">
                            <Lightbulb size={14} className="shrink-0 mt-0.5" />
                            <span className="text-[11px]">Alıcı için CRM notuna ekle: <strong>"Bu evi değerlendirmeniz için eksik kalan bilgi ne?"</strong></span>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-[13px] font-bold text-slate-800 block">Satıcı Motivasyon Rehberi</h3>
                        <ChevronDown size={16} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-xs text-slate-600 pl-4 space-y-2">
                        <p>Mülk sahibinin 'Notlarını' şu motivasyonlara göre doldur:</p>
                        <ul className="space-y-1 list-disc pl-4">
                            <li><strong>Acil Satıcı:</strong> Süre baskısı var.</li>
                            <li><strong>Fiyat Test Eden:</strong> Satmaya niyeti yok, piyasaya bakıyor.</li>
                            <li><strong>Kararsız:</strong> İhtiyacı var ama tereddütlü.</li>
                            <li><strong>Gerçekçi:</strong> Piyasa dinamiklerini anlıyor.</li>
                            <li><strong>Yetki Vermeyen:</strong> Kendi satabileceğini düşünüyor.</li>
                        </ul>
                        <div className="bg-blue-50 text-blue-800 p-2 rounded-lg border border-blue-100 mt-2 flex gap-1.5 items-start">
                            <Lightbulb size={14} className="shrink-0 mt-0.5" />
                            <span className="text-[11px]">Satıcı için CRM notuna ekle: <strong>"Bu fiyat stratejisini uygulamamız için sizi tereddütte bırakan şey ne?"</strong></span>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-[13px] font-bold text-slate-800 block">CMA / Değer Analizi</h3>
                        <ChevronDown size={16} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-xs text-slate-600 pl-4 space-y-2">
                        <ul className="space-y-1 list-disc pl-4">
                            <li>Emsal ilanları seç.</li>
                            <li>m2, kat, cephe, bina yaşı, aidat, otopark, konum farkını not et.</li>
                            <li>Benzer ilanların fiyat bandını çıkar.</li>
                            <li>Satıcıya tek fiyat değil, fiyat aralığı sun.</li>
                            <li>Satılabilir fiyat ile istenen fiyatı ayır.</li>
                            <li>Piyasa verisi olmadan fiyat konuşma.</li>
                        </ul>
                        <div className="bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-200 mt-2 flex gap-1.5 items-start">
                            <Lightbulb size={14} className="shrink-0 mt-0.5 text-slate-400" />
                            <p className="italic font-medium text-[11px]">"Size tahmini bir fiyat söylemek yerine, benzer mülkler ve talep durumuna göre kısa bir piyasa değer analizi hazırlayayım. Böylece satılabilir fiyat bandını birlikte netleştirelim."</p>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-[13px] font-bold text-slate-800 block">Yetki Görüşmesi Kontrol Listesi</h3>
                        <ChevronDown size={16} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-xs text-slate-600 pl-4 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Satıcının nedeni belli mi?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Satış süresi beklentisi belli mi?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Fiyat esnekliği var mı?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Rakip ilanlar gösterildi mi?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Pazarlama planı anlatıldı mı?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Haftalık rapor sözü verildi mi?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Yetkili çalışma avantajı anlatıldı mı?</label>
                            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-md border border-slate-100 text-[11px]"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Komisyon itirazına cevap hazır mı?</label>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-[13px] font-bold text-slate-800 block">Portföy Süreci Rehberi</h3>
                        <ChevronDown size={16} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 text-xs text-slate-600 pl-4">
                        <p className="mb-3 text-[11px]">Bir portföy adayının ilk görüşmeden kapanışa kadar geçtiği temel süreci gösterir.</p>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Portföy Adayı</span>
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Değer Analizi</span>
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Yetki Görüşmesi</span>
                            <span className="px-2 py-1 bg-[#00D2B4]/10 rounded border border-[#00D2B4]/30 text-emerald-700 font-bold">Yetkili Portföy</span>
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Yayında</span>
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Gösterimde</span>
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Teklif</span>
                            <span className="px-2 py-1 bg-slate-100 rounded font-medium">Müzakere</span>
                            <span className="px-2 py-1 bg-emerald-50 rounded text-emerald-600 font-bold border border-emerald-200">Anlaşma</span>
                            <span className="px-2 py-1 bg-emerald-100 rounded text-emerald-700 font-black border border-emerald-300">Tapu/Kira</span>
                            <span className="px-2 py-1 bg-slate-800 text-white rounded font-bold">Kapandı</span>
                            <span className="px-2 py-1 bg-red-50 text-red-600 rounded border border-red-100">Kaybedildi</span>
                        </div>
                    </div>
                </details>
            </div>
        </details>
    );
}

