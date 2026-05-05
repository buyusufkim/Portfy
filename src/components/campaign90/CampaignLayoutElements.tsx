import React from 'react';
import { Trophy, Activity, Target, ExternalLink, ChevronDown, Lightbulb, BookOpen } from 'lucide-react';
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
    dayStatus = 'not_started'
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            {/* Header Progress Card */}
            <div className="p-6 bg-slate-900 text-white rounded-[32px] relative overflow-hidden shadow-xl shadow-slate-900/10">
                <div className="absolute -right-4 -top-4 opacity-10">
                   <Trophy size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                          <Trophy size={24} className="text-[#00D2B4]" />
                       </div>
                       <div>
                           <div className="text-[11px] uppercase tracking-widest font-bold text-[#00D2B4] mb-1">Portfy Mentor</div>
                           <h2 className="font-bold text-lg leading-tight">Kamp İlerlemesi</h2>
                       </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                        <div className="text-sm font-bold text-white/80">Gün {currentDay} / 90</div>
                        <div className="text-sm font-black text-white">{completedPercent}% Toplam</div>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-[#00D2B4] rounded-full transition-all duration-1000" style={{ width: `${completedPercent}%` }} />
                    </div>

                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex flex-col gap-3">
                        <div className="flex flex-row items-center justify-between">
                            <div className="text-[11px] font-bold text-[#00D2B4] tracking-wide">
                                ÇALIŞMA GÜNÜ: {dayStatus === 'not_started' ? 'BAŞLAMADI' : dayStatus === 'active' ? 'AKTİF' : 'KAPANDI'}
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-lg font-black text-white">{todayCompleted}</span>
                                <span className="text-sm font-bold text-white/60 mb-0.5">/ {todayTotal} bitti</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's GPA Card */}
            <Card className="p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                   <h3 className="font-black text-slate-800 mb-1 flex items-center gap-2 text-lg tracking-tight">
                       <Activity size={18} className="text-[#00D2B4]" /> 
                       Bugünkü GPA
                   </h3>
                   <p className="text-xs font-bold text-slate-400 mb-5">Günlük hedeflerin durumu</p>
                   
                   <div className="grid grid-cols-3 gap-3">
                       <div className="text-center group">
                           <div className="w-full aspect-square bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center mb-2 border border-blue-100/50 transition-colors group-hover:bg-blue-50">
                               <span className="text-[10px] font-black text-blue-400/80 uppercase">G</span>
                               <span className="font-black text-blue-600 text-xl leading-none mt-1">{todayG}</span>
                           </div>
                           <div className="text-[10px] font-bold text-slate-500">Tamamlanan</div>
                       </div>
                       <div className="text-center group">
                           <div className="w-full aspect-square bg-purple-50/50 rounded-2xl flex flex-col items-center justify-center mb-2 border border-purple-100/50 transition-colors group-hover:bg-purple-50">
                               <span className="text-[10px] font-black text-purple-400/80 uppercase">P</span>
                               <span className="font-black text-purple-600 text-xl leading-none mt-1">{todayP}</span>
                           </div>
                           <div className="text-[10px] font-bold text-slate-500">Tamamlanan</div>
                       </div>
                       <div className="text-center group">
                           <div className="w-full aspect-square bg-orange-50/50 rounded-2xl flex flex-col items-center justify-center mb-2 border border-orange-100/50 transition-colors group-hover:bg-orange-50">
                               <span className="text-[10px] font-black text-orange-400/80 uppercase">A</span>
                               <span className="font-black text-orange-600 text-xl leading-none mt-1">{todayA}</span>
                           </div>
                           <div className="text-[10px] font-bold text-slate-500">Tamamlanan</div>
                       </div>
                   </div>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-500">Bugünkü Skor</span>
                       <span className="font-black text-slate-800 text-xl">{todayScore} Puan</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-xs font-bold text-slate-500">Kümülatif Skor</span>
                       <span className="text-sm font-bold text-[#00D2B4]">{cumulativeScore} Puan</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const CampaignProfessionalGuides: React.FC = () => {
    return (
        <details className="group [&_summary::-webkit-details-marker]:hidden bg-white border border-slate-200 rounded-[32px] shadow-sm">
            <summary className="p-5 md:px-6 md:py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-[32px]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-500" /> Mesleki Rehberler
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Alıcı, satıcı, değer analizi, yetki ve portföy sürecini buradan kontrol et.
                    </p>
                </div>
                <ChevronDown size={24} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
            </summary>
            
            <div className="border-t border-slate-100 flex flex-col divide-y divide-slate-100 bg-slate-50/50 rounded-b-[32px]">
                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-base font-bold text-slate-800 block">Alıcı Segmenti Rehberi</h3>
                        <ChevronDown size={20} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-600 pl-5 space-y-3">
                        <p>Mevcut 'Sıcaklık' ve 'Notlar' alanlarını kullanarak adaylarını segmente et:</p>
                        <ul className="space-y-2">
                            <li><strong className="text-emerald-600">A Alıcı:</strong> Bütçesi net, karar süresi yakın, ihtiyaç belirli.</li>
                            <li><strong className="text-blue-600">B Alıcı:</strong> 1-3 ay içinde karar verebilir, takip ister.</li>
                            <li><strong className="text-slate-500">C Alıcı:</strong> Araştırma aşamasında, düşük öncelik.</li>
                        </ul>
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 mt-3 flex gap-2">
                            <Lightbulb size={18} className="shrink-0 mt-0.5" />
                            <span>Alıcı için CRM notuna ekle: <strong>"Bu evi değerlendirmeniz için eksik kalan bilgi ne?"</strong></span>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-base font-bold text-slate-800 block">Satıcı Motivasyon Rehberi</h3>
                        <ChevronDown size={20} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-600 pl-5 space-y-3">
                        <p>Mülk sahibinin 'Notlarını' şu motivasyonlara göre doldur:</p>
                        <ul className="space-y-1.5 list-disc pl-5">
                            <li><strong>Acil Satıcı:</strong> Süre baskısı var.</li>
                            <li><strong>Fiyat Test Eden:</strong> Satmaya niyeti yok, piyasaya bakıyor.</li>
                            <li><strong>Kararsız:</strong> İhtiyacı var ama tereddütlü.</li>
                            <li><strong>Gerçekçi:</strong> Piyasa dinamiklerini anlıyor.</li>
                            <li><strong>Yetki Vermeyen:</strong> Kendi satabileceğini düşünüyor.</li>
                        </ul>
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 mt-3 flex gap-2">
                            <Lightbulb size={18} className="shrink-0 mt-0.5" />
                            <span>Satıcı için CRM notuna ekle: <strong>"Bu fiyat stratejisini uygulamamız için sizi tereddütte bırakan şey ne?"</strong></span>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-base font-bold text-slate-800 block">CMA / Değer Analizi</h3>
                        <ChevronDown size={20} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-600 pl-5 space-y-3">
                        <ul className="space-y-1.5 list-disc pl-5">
                            <li>Emsal ilanları seç.</li>
                            <li>m2, kat, cephe, bina yaşı, aidat, otopark, konum farkını not et.</li>
                            <li>Benzer ilanların fiyat bandını çıkar.</li>
                            <li>Satıcıya tek fiyat değil, fiyat aralığı sun.</li>
                            <li>Satılabilir fiyat ile istenen fiyatı ayır.</li>
                            <li>Piyasa verisi olmadan fiyat konuşma.</li>
                        </ul>
                        <div className="bg-slate-50 text-slate-800 p-3 rounded-xl border border-slate-200 mt-3 flex gap-2">
                            <Lightbulb size={18} className="shrink-0 mt-0.5 text-slate-400" />
                            <p className="italic font-medium">"Size tahmini bir fiyat söylemek yerine, benzer mülkler ve talep durumuna göre kısa bir piyasa değer analizi hazırlayayım. Böylece satılabilir fiyat bandını birlikte netleştirelim."</p>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-base font-bold text-slate-800 block">Yetki Görüşmesi Kontrol Listesi</h3>
                        <ChevronDown size={20} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-600 pl-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Satıcının nedeni belli mi?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Satış süresi beklentisi belli mi?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Fiyat esnekliği var mı?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Rakip ilanlar gösterildi mi?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Pazarlama planı anlatıldı mı?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Haftalık rapor sözü verildi mi?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Yetkili çalışma avantajı anlatıldı mı?</label>
                            <label className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><input type="checkbox" disabled className="rounded text-[#00D2B4]" /> Komisyon itirazına cevap hazır mı?</label>
                        </div>
                    </div>
                </details>

                <details className="group/item [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <h3 className="text-base font-bold text-slate-800 block">Portföy Süreci Rehberi</h3>
                        <ChevronDown size={20} className="text-slate-400 group-open/item:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-slate-600 pl-5">
                        <p className="mb-4">Bir portföy adayının ilk görüşmeden kapanışa kadar geçtiği temel süreci gösterir.</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Portföy Adayı</span>
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Değer Analizi</span>
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Yetki Görüşmesi</span>
                            <span className="px-3 py-1.5 bg-[#00D2B4]/10 rounded-md border border-[#00D2B4]/30 text-emerald-700 font-bold">Yetkili Portföy</span>
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Yayında</span>
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Gösterimde</span>
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Teklif</span>
                            <span className="px-3 py-1.5 bg-slate-100 rounded-md font-medium">Müzakere</span>
                            <span className="px-3 py-1.5 bg-emerald-50 rounded-md text-emerald-600 font-bold border border-emerald-200">Anlaşma</span>
                            <span className="px-3 py-1.5 bg-emerald-100 rounded-md text-emerald-700 font-black border border-emerald-300">Tapu/Kiralama</span>
                            <span className="px-3 py-1.5 bg-slate-800 text-white rounded-md font-bold">Kapandı</span>
                            <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md border border-red-100">Kaybedildi</span>
                        </div>
                    </div>
                </details>
            </div>
        </details>
    );
};

