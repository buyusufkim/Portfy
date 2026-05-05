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
        <Card className={`overflow-hidden transition-all duration-300 ${isMajorMilestone && isOpen ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10' : 'border border-slate-200 shadow-sm'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 md:px-5 md:py-4 transition-colors ${isOpen ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50' : 'bg-white hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isMajorMilestone ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                       {report.reportType === 'day90' ? <Award size={24} /> : <BarChart3 size={24} />}
                    </div>
                    <div className="text-left">
                        <div className="text-[11px] font-black text-indigo-500 tracking-wider uppercase mb-1">
                            {isMajorMilestone ? 'OTOMATİK PERFORMANS RAPORU' : 'İSTATİSTİK'}
                        </div>
                        <h2 className="text-xl font-black text-slate-800">{title}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isMajorMilestone && !isOpen && (
                        <span className="hidden sm:inline-flex text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-full border border-red-200 tracking-wide uppercase">Yeni</span>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-white text-slate-800 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
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
                        <div className="p-4 md:px-5 md:py-4 space-y-5">
                            
                            {/* Overall Progress */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <div className="text-slate-500 font-bold text-xs mb-1">Görev Oranı</div>
                                    <div className="text-2xl font-black text-slate-800">%{report.completionRate}</div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                    <div className="text-emerald-600 font-bold text-xs mb-1">Toplam XP</div>
                                    <div className="text-2xl font-black text-emerald-700">+{report.earnedXp}</div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                    <div className="text-blue-600 font-bold text-xs mb-1">Birebir Temas (CRM)</div>
                                    <div className="text-2xl font-black text-blue-700">{report.leadsCreated}</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                                    <div className="text-purple-600 font-bold text-xs mb-1">Saha Aktivitesi</div>
                                    <div className="text-2xl font-black text-purple-700">{report.fieldVisits + report.mapPins}</div>
                                </div>
                            </div>

                            {/* GPA breakdown */}
                            <div className="bg-white border rounded-2xl p-5 shadow-sm">
                                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-indigo-500" /> G/P/A Tamamlama Etkinliği</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                            <span className="flex items-center gap-1.5"><Target size={14} className="text-blue-500" /> (G) Gelir Getirici</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{report.gCompleted} Skor</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                            <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-purple-500" /> (P) Portföy</span>
                                            <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{report.pCompleted} Skor</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                            <span className="flex items-center gap-1.5"><Compass size={14} className="text-orange-500" /> (A) Alan Uzmanlığı</span>
                                            <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{report.aCompleted} Skor</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CRM & Takip Özeti */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <Target size={16} className="text-[#FF6B1A]" /> 
                                        CRM & Takip Özeti
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                            <span className="text-slate-600 font-medium">Eklenen Alıcı/Kiracı Adayı</span>
                                            <span className="font-bold text-slate-800">{report.buyerLeads}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                            <span className="text-slate-600 font-medium">Eklenen Satıcı Adayı</span>
                                            <span className="font-bold text-slate-800">{report.ownerSellerLeads}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                            <span className="text-slate-600 font-medium">Tamamlanan Takip</span>
                                            <span className="font-bold text-slate-800">{report.followupActions}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                            <span className="text-slate-600 font-medium">Geciken Takip</span>
                                            <span className={`font-bold ${report.overdueFollowups > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{report.overdueFollowups}</span>
                                        </div>
                                        {crmStats && (
                                            <>
                                                <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                                    <span className="text-slate-600 font-medium">Sessiz Aday Uyarısı</span>
                                                    <span className={`font-bold ${crmStats.silenceRiskCount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{crmStats.silenceRiskCount}</span>
                                                </div>
                                                <div className="flex justify-between text-sm py-2">
                                                    <span className="text-slate-600 font-medium">Gösterim Sonrası Takip</span>
                                                    <span className="font-bold text-slate-800">{crmStats.showingTasksToFollowUp}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Portföy & Pipeline Özeti */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Activity size={16} className="text-blue-500" /> 
                                            Portföy & Pipeline Özeti
                                        </h4>
                                        <div className="space-y-3">
                                            {crmStats && (
                                                <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                                    <span className="text-slate-600 font-medium">Bugün Eklenen Portföy</span>
                                                    <span className="font-bold text-slate-800">{crmStats.addedPropertiesToday}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                                <span className="text-slate-600 font-medium">Aktif Portföy</span>
                                                <span className="font-bold text-slate-800">{report.activeProperties}</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                                <span className="text-slate-600 font-medium">Riskli Portföy</span>
                                                <span className={`font-bold ${report.lowHealthProperties > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{report.lowHealthProperties}</span>
                                            </div>
                                            {crmStats && (
                                                <>
                                                    <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                                        <span className="text-slate-600 font-medium">30+ Gün Güncellenmeyen Portföy</span>
                                                        <span className={`font-bold ${crmStats.oldPropertiesCount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{crmStats.oldPropertiesCount}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm py-2">
                                                        <span className="text-slate-600 font-medium">Revizyon Bekleyen Portföy</span>
                                                        <span className={`font-bold ${crmStats.attentionNeededCount > 0 ? 'text-orange-500' : 'text-slate-800'}`}>{crmStats.attentionNeededCount}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Saha Özeti */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Compass size={16} className="text-purple-500" /> 
                                            Saha Özeti
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                                <span className="text-slate-600 font-medium">Saha Ziyareti</span>
                                                <span className="font-bold text-slate-800">{report.fieldVisits}</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2">
                                                <span className="text-slate-600 font-medium">Haritada İşlenen Konum</span>
                                                <span className="font-bold text-slate-800">{report.mapPins}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strengths / Weaknesses */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                                <div className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">En Güçlü Alanın</div>
                                    <div className="text-sm font-bold text-emerald-900">{report.strongestArea}</div>
                                </div>
                                <div className="flex-1 bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Gelişime Açık Alanın</div>
                                    <div className="text-sm font-bold text-amber-900">{report.weakestArea}</div>
                                </div>
                            </div>

                            {/* Mentor summary */}
                            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl mt-4">
                                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle size={14} /> Mentor Yorumu</h4>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed text-balance">
                                    {report.mentorSummary}
                                </p>
                            </div>

                            {/* Day 90 / Next steps */}
                            {report.reportType === 'day90' && (
                                <div className="mt-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
                                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none -mt-4 -mr-4">
                                        <Award size={160} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="inline-flex text-[10px] font-black tracking-widest text-[#00D2B4] uppercase px-3 py-1 rounded-full bg-[#00D2B4]/10 border border-[#00D2B4]/20 mb-4">
                                            MEZUNİYET
                                        </div>
                                        <h3 className="text-2xl font-black mb-2">90 Gün Tamamlandı, Sırada Ne Var?</h3>
                                        <p className="text-slate-300 font-medium text-sm leading-relaxed mb-6 max-w-lg">
                                            Bu süreç boyunca disiplini tecrübe ettin. Gayrimenkul brokerlığında başarı tesadüf değil, tekrardır. 
                                            Şimdiki hedefin bu standartları yeni normalin yapmak.
                                        </p>
                                        
                                        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 mb-6 backdrop-blur-sm">
                                            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Yeni 90 Gün Planın</h4>
                                            <p className="text-[#00D2B4] font-bold">👉 {report.nextFocus}</p>
                                        </div>

                                        <button 
                                            onClick={copyReport}
                                            className="w-full sm:w-auto bg-[#00D2B4] hover:bg-[#00BFA5] text-slate-900 font-black text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#00D2B4]/20 flex justify-center items-center gap-2"
                                        >
                                            <Copy size={16} /> Gayrimenkulde İlk 90 Günüm Raporunu Kopyala
                                        </button>
                                        <p className="text-xs font-medium text-slate-400 mt-4">Bunu sosyal medyada paylaşarak istikrarını ve uzmanlaşma sürecini çevrene gösterebilirsin.</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};
