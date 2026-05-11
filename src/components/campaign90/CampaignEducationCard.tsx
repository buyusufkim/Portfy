import React, { useState } from 'react';
import { Card } from '../UI';
import { motion } from 'motion/react';
import { BookOpen, Check, Target, ChevronDown, X, Lightbulb, Briefcase } from 'lucide-react';
import { CampaignCurriculumDay } from '../../data/campaignEducationCurriculum';

interface Props {
    curriculum: CampaignCurriculumDay;
    readOnly?: boolean;
}

export const CampaignEducationCard: React.FC<Props> = ({ curriculum, readOnly = false }) => {
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

    return (
        <Card className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm">
            <div className="p-4 md:p-5 relative">
                <div className="absolute right-0 top-0 opacity-[0.03] text-slate-900 pointer-events-none">
                    <BookOpen size={100} />
                </div>
                <div className="relative z-10 block">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                        <div className="flex flex-col">
                            <div className="text-[9px] font-black text-[#00D2B4] tracking-widest uppercase bg-[#00D2B4]/10 px-2 py-0.5 rounded w-max mb-1.5">
                                GÜNÜN EĞİTİMİ: {curriculum.module_title}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 leading-tight">{curriculum.lesson_title}</h2>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {curriculum.learning_goals.map((goal, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                <Check size={10} className="text-[#00D2B4]" />
                                {goal}
                            </div>
                        ))}
                    </div>
                    
                    <p className="text-slate-600 font-medium text-[13px] leading-relaxed line-clamp-2">{curriculum.lesson_body}</p>
                </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50">
                <details className="group [&_summary::-webkit-details-marker]:hidden">
                    <summary className="p-3 px-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="font-bold text-[13px] text-slate-800 flex items-center gap-1.5">
                            <Target size={14} className="text-indigo-500" />
                            Eğitim Detayları ve Saha Uygulaması
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <span className="group-open:hidden">Aç ve İncele</span>
                            <span className="hidden group-open:block">Kapat</span>
                            <ChevronDown size={14} className="group-open:rotate-180 transition-transform"/>
                        </div>
                    </summary>
                    <div className="px-5 pb-5 pt-2 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 mb-4 shadow-sm">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Eğitim Metni</h4>
                            <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{curriculum.lesson_body}</p>
                        </div>
                        
                        <div className="bg-white border-l-4 border-indigo-500 p-4 rounded-r-xl shadow-sm">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Sahada Nasıl Uygulanır?</h4>
                            <p className="text-sm font-medium text-slate-800">{curriculum.field_example}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                                <h4 className="text-xs font-black text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><X size={14} /> En Sık Yapılan Hata</h4>
                                <p className="text-sm font-medium text-slate-700">{curriculum.common_mistake}</p>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lightbulb size={14} /> Profesyonel İpucu</h4>
                                <p className="text-sm font-medium text-slate-700">{curriculum.pro_tip}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-[0.05] text-white pointer-events-none">
                                <BookOpen size={100} className="-mt-4 -mr-4" />
                            </div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 relative z-10"><BookOpen size={14} /> Bugünün Örnek Scripti</h4>
                            <div className="bg-slate-800/50 rounded-lg p-3 relative z-10">
                                <p className="text-sm font-medium text-slate-300 italic whitespace-pre-wrap">"{curriculum.script_example}"</p>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-slate-100 p-5 rounded-2xl">
                            <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Target size={16} className="text-rose-500" /> Mini Quiz</h4>
                            <div className="space-y-6">
                                {curriculum.mini_quiz.map((q, idx) => {
                                    const selectedOpt = quizAnswers[idx];
                                    const isAnswered = selectedOpt !== undefined;
                                    
                                    return (
                                        <div key={idx} className="space-y-3">
                                            <p className="text-sm font-bold text-slate-800">{idx + 1}. {q.question}</p>
                                            <div className="flex flex-col gap-2">
                                                {q.options.map((opt, oIdx) => {
                                                    let optionClass = "flex items-start gap-3 p-3 rounded-xl border transition-all text-[13px] font-medium ";
                                                    
                                                    if (!isAnswered && !readOnly) {
                                                        optionClass += "border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer text-slate-700";
                                                    } else {
                                                        if (oIdx === q.correctAnswer) {
                                                            optionClass += "border-[#00D2B4] bg-[#00D2B4]/10 text-emerald-800 cursor-default shadow-sm ring-1 ring-[#00D2B4]/50";
                                                        } else if (oIdx === selectedOpt) {
                                                            optionClass += "border-rose-200 bg-rose-50 text-rose-800 cursor-default";
                                                        } else {
                                                            optionClass += "border-slate-100 bg-slate-50/50 text-slate-400 cursor-default opacity-60";
                                                        }
                                                    }

                                                    return (
                                                        <label 
                                                            key={oIdx} 
                                                            className={optionClass}
                                                        >
                                                            <input 
                                                                type="radio" 
                                                                name={`quiz-${curriculum.lesson_title}-${idx}`} 
                                                                checked={selectedOpt === oIdx}
                                                                onChange={() => {
                                                                    if (!isAnswered && !readOnly) {
                                                                        setQuizAnswers(prev => ({...prev, [idx]: oIdx}));
                                                                    }
                                                                }}
                                                                disabled={isAnswered || readOnly}
                                                                className="mt-0.5 shrink-0" 
                                                            />
                                                            <span className="leading-relaxed">{opt}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {isAnswered && q.explanation && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                                    className="mt-3 p-3.5 rounded-xl bg-slate-50 text-[13px] text-slate-700 border border-slate-200 shadow-sm flex gap-2.5 items-start"
                                                >
                                                    <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <span className="font-semibold leading-relaxed">{q.explanation}</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-[#00D2B4]/10 border border-[#00D2B4]/20 p-4 rounded-xl flex items-start gap-3">
                            <div className="mt-0.5">
                                <Briefcase size={18} className="text-[#00D2B4]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">Bugünün Saha Ödevi</h4>
                                <p className="text-sm font-medium text-slate-700">{curriculum.practice_assignment}</p>
                            </div>
                        </div>

                    </div>
                </details>
            </div>
        </Card>
    );
}
