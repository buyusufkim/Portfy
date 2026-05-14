import React, { useState } from 'react';
import { Card } from '../UI';
import { Campaign90Report } from '../../hooks/useCampaign90Report';
import { Campaign90Stats } from '../../hooks/useCampaign90Stats';
import { Target, Activity, CheckCircle, BarChart3, ChevronDown, Copy, Award, BookOpen, Compass, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
    report: Campaign90Report;
    crmStats?: Campaign90Stats | null;
}

export const CampaignReportCard: React.FC<Props> = ({ report, crmStats }) => {
    const isMajorMilestone = report.reportType !== 'regular';
    const [isOpen, setIsOpen] = useState(isMajorMilestone);

    if (!report) return null;

    let title = "Kamp Gelişim Raporu";
    if (report.reportType === 'day30') title = "İlk Ay Karnesi";
    if (report.reportType === 'day60') title = "İkinci Ay Karnesi";
    if (report.reportType === 'day90') title = "90 Gün Mezuniyet Raporu";

    const copyReport = () => {
        const text = `
🏆 Gayrimenkulde İlk 90 Günüm - Portfy Karne
Görev Tamamlama: ${report.completionRate}%
Kazanılan XP: ${report.earnedXp}
İletişim (CRM Kaydı): ${report.leadsCreated}
Doğru Fiyatlı Portföy Üretimi: ${report.propertiesCreated}
Kazanılan Alıcı: ${report.buyerLeads}
Kazanılan Satıcı: ${report.ownerSellerLeads}

En Güçlü Alanım: ${report.strongestArea}
Sonraki Hedef: ${report.reportType === 'day90' ? report.nextFocus : report.mentorSummary}
        `.trim();
        navigator.clipboard.writeText(text);
        toast.success("Rapor kopyalandı!");
    };

    return (
        <Card className={`overflow-hidden transition-all duration-300 ${isMajorMilestone && isOpen ? 'ring-1 ring-indigo-500 shadow-md' : 'border border-slate-200 shadow-sm'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isOpen ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50' : 'bg-white hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMajorMilestone ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                       {report.reportType === 'day90' ? <Award size={16} /> : <BarChart3 size={16} />}
                    </div>
                    <div className="text-left flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h2 className="text-sm font-black text-slate-800">{title}</h2>
                        <span className="text-[9px] font-bold text-indigo-500 tracking-wider uppercase bg-indigo-50 px-1.5 py-0.5 rounded w-max">
                            {isMajorMilestone ? 'OTOMATİK RAPOR' : 'İSTATİSTİK'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isMajorMilestone && !isOpen && (
                        <span className="hidden sm:inline-flex text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-200 tracking-wide uppercase">Yeni</span>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-white border-t border-slate-100"
                    >
                        <div className="p-4 space-y-3">
                            
                            {/* Overall Progress */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                                    <div className="text-slate-500 font-bold text-[10px] mb-0.5 uppercase tracking-wide">Görev Oranı</div>
                                    <div className="text-lg font-black text-slate-800 leading-none">%{report.completionRate}</div>
                                </div>
                                <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col justify-center">
                                    <div className="text-emerald-600 font-bold text-[10px] mb-0.5 uppercase tracking-wide">Toplam XP</div>
                                    <div className="text-lg font-black text-emerald-700 leading-none">+{report.earnedXp}</div>
                                </div>
                                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-center">
                                    <div className="text-blue-600 font-bold text-[10px] mb-0.5 uppercase tracking-wide">Birebir Temas</div>
                                    <div className="text-lg font-black text-blue-700 leading-none">{report.leadsCreated}</div>
                                </div>
                                <div className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col justify-center">
                                    <div className="text-purple-600 font-bold text-[10px] mb-0.5 uppercase tracking-wide">Saha Aktivitesi</div>
                                    <div className="text-lg font-black text-purple-700 leading-none">{report.fieldVisits + report.mapPins}</div>
                                </div>
                            </div>

                            {/* GPA breakdown compact strip */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <div className="text-[11px] font-black text-slate-700 flex items-center gap-1.5 shrink-0">
                                    <Activity size={12} className="text-indigo-500" /> G/P/A Etkinliği:
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Target size={10} /> Gelir: {report.gCompleted}
                                    </span>
                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Briefcase size={10} /> Portföy: {report.pCompleted}
                                    </span>
                                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Compass size={10} /> Alan Uzm.: {report.aCompleted}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* CRM & Takip Özeti */}
                                <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-3 shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-800 mb-2 flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wide">
                                        <Target size={12} className="text-[#FF6B1A]" /> CRM Özeti
                                    </h4>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                            <span className="text-slate-500 font-medium truncate pr-2">Aday Ekleme (Al/Sat)</span>
                                            <span className="font-bold text-slate-800 shrink-0">{report.buyerLeads}/{report.ownerSellerLeads}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                            <span className="text-slate-500 font-medium truncate pr-2">Biten/Geciken Takip</span>
                                            <span className="font-bold text-slate-800 shrink-0">{report.followupActions} / <span className={report.overdueFollowups > 0 ? 'text-red-500' : ''}>{report.overdueFollowups}</span></span>
                                        </div>
                                        {crmStats && (
                                            <>
                                                <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                                    <span className="text-slate-500 font-medium truncate pr-2">Sessiz Aday Uyarısı</span>
                                                    <span className={`font-bold shrink-0 ${crmStats.silenceRiskCount > 0 ? 'text-orange-500' : 'text-slate-800'}`}>{crmStats.silenceRiskCount}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] py-0.5">
                                                    <span className="text-slate-500 font-medium truncate pr-2">Gösterim Sonrası Takip</span>
                                                    <span className="font-bold text-slate-800 shrink-0">{crmStats.showingTasksToFollowUp}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Portföy & Pipeline Özeti */}
                                <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-3 shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-800 mb-2 flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wide">
                                        <Briefcase size={12} className="text-blue-500" /> Portföy Özeti
                                    </h4>
                                    <div className="space-y-1.5">
                                        {crmStats && (
                                            <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                                <span className="text-slate-500 font-medium truncate pr-2">Bugün Eklenen</span>
                                                <span className="font-bold text-slate-800 shrink-0">{crmStats.addedPropertiesToday}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                            <span className="text-slate-500 font-medium truncate pr-2">Aktif / Riskli Portföy</span>
                                            <span className="font-bold text-slate-800 shrink-0">{report.activeProperties} / <span className={report.lowHealthProperties > 0 ? 'text-red-500' : ''}>{report.lowHealthProperties}</span></span>
                                        </div>
                                        {crmStats && (
                                            <>
                                                <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                                    <span className="text-slate-500 font-medium truncate pr-2">30+ Gün Güncellenmeyen</span>
                                                    <span className={`font-bold shrink-0 ${crmStats.oldPropertiesCount > 0 ? 'text-orange-500' : 'text-slate-800'}`}>{crmStats.oldPropertiesCount}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] py-0.5">
                                                    <span className="text-slate-500 font-medium truncate pr-2">Revizyon Bekleyen</span>
                                                    <span className={`font-bold shrink-0 ${crmStats.attentionNeededCount > 0 ? 'text-orange-500' : 'text-slate-800'}`}>{crmStats.attentionNeededCount}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Saha Özeti */}
                                <div className="bg-white border text-center sm:text-left border-slate-200 rounded-xl p-3 shadow-sm h-min">
                                    <h4 className="text-[11px] font-black text-slate-800 mb-2 flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wide">
                                        <Compass size={12} className="text-purple-500" /> Saha Özeti
                                    </h4>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] py-0.5 border-b border-dashed border-slate-100">
                                            <span className="text-slate-500 font-medium truncate pr-2">Saha Ziyareti</span>
                                            <span className="font-bold text-slate-800 shrink-0">{report.fieldVisits}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] py-0.5">
                                            <span className="text-slate-500 font-medium truncate pr-2">Haritada İşlenen Konum</span>
                                            <span className="font-bold text-slate-800 shrink-0">{report.mapPins}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strengths / Weaknesses / Mentor */}
                            <div className="flex flex-col gap-2 mt-3">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider shrink-0">En Güçlü:</span>
                                        <span className="text-[11px] font-bold text-emerald-900 truncate">{report.strongestArea}</span>
                                    </div>
                                    <div className="flex-1 bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider shrink-0">Gelişim Açık:</span>
                                        <span className="text-[11px] font-bold text-amber-900 truncate">{report.weakestArea}</span>
                                    </div>
                                </div>
                                <div className="bg-indigo-50/50 border border-indigo-100 px-3 py-2.5 rounded-lg flex gap-2 items-start">
                                    <CheckCircle size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-medium text-slate-700 leading-snug lg:line-clamp-2" title={report.mentorSummary}>
                                        <span className="font-bold text-indigo-700 mr-1">Mentor:</span>
                                        {report.mentorSummary}
                                    </p>
                                </div>
                            </div>

                            {/* Day 90 / Next steps */}
                            {report.reportType === 'day90' && (
                                <div className="mt-4 bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden shadow-sm">
                                    <div className="relative z-10">
                                        <div className="inline-flex text-[9px] font-black tracking-widest text-[#00D2B4] uppercase px-2 py-0.5 rounded bg-[#00D2B4]/10 border border-[#00D2B4]/20 mb-2">
                                            MEZUNİYET
                                        </div>
                                        <h3 className="text-lg font-black mb-1">90 Gün Tamamlandı, Sırada Ne Var?</h3>
                                        <p className="text-slate-300 font-medium text-xs leading-relaxed mb-4 max-w-lg">
                                            Gayrimenkul brokerlığında başarı tesadüf değil, tekrardır. Şimdiki hedefin bu standartları yeni normalin yapmak.
                                        </p>
                                        
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/20 mb-4 backdrop-blur-sm">
                                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Yeni 90 Gün Planın</h4>
                                            <p className="text-[#00D2B4] font-bold text-xs">👉 {report.nextFocus}</p>
                                        </div>

                                        <button 
                                            onClick={copyReport}
                                            className="w-full sm:w-auto bg-[#00D2B4] hover:bg-[#00BFA5] text-slate-900 font-black text-[11px] px-4 py-2.5 rounded-lg transition-all shadow shadow-[#00D2B4]/20 flex justify-center items-center gap-2"
                                        >
                                            <Copy size={14} /> Şablonu Kopyala ve Paylaş
                                        </button>
                                    </div>
                                    <Award size={100} className="absolute right-0 bottom-0 opacity-10 pointer-events-none -mb-4 -mr-4" />
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

