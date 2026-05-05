import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CampaignTask } from '../../types';
import { CampaignTaskProgress } from '../../services/campaignProgressService';

interface TaskGroupProps {
    title: string;
    icon: LucideIcon;
    tasks: CampaignTask[];
    onComplete: (taskId: string) => void;
    onSkip: (taskId: string) => void;
    defaultOpen?: boolean;
    colorClass: string;
    progressMap?: Record<string, CampaignTaskProgress>;
}

export const CampaignTaskGroup: React.FC<TaskGroupProps> = ({ 
    title, 
    icon: Icon, 
    tasks, 
    onComplete, 
    onSkip, 
    defaultOpen = true, 
    colorClass, 
    progressMap 
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    if (!tasks || tasks.length === 0) return null;

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const verifiedPendingCount = tasks.filter(t => {
        if (t.status === 'completed') return false;
        const p = progressMap?.[t.id];
        return p && p.current >= p.target;
    }).length;

    return (
        <div className="flex flex-col">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 transition-colors focus:outline-none ${
                    isOpen ? 'bg-slate-50 border border-b-0 border-slate-100 rounded-t-2xl' : 'bg-white shadow-sm rounded-2xl border border-slate-100'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon size={16} />
                    </div>
                    <h3 className="font-bold text-slate-800">{title}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-sm">
                        {completedCount} tamamlandı{verifiedPendingCount > 0 ? ` · ${verifiedPendingCount} doğrulandı` : ''}
                    </span>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-white border border-slate-100 rounded-b-2xl shadow-sm"
                    >
                        <div className="p-2 space-y-2">
                            {tasks.map((task) => {
                                const p = progressMap?.[task.id];
                                const hasProgress = !!p;
                                const isVerified = p && p.current >= p.target;
                                const isCompleted = task.status === 'completed';

                                return (
                                <div key={task.id} className={`p-4 transition-all duration-300 rounded-xl flex gap-4 items-start ${
                                    isCompleted ? 'bg-slate-50/50 opacity-60' : 'bg-white hover:bg-slate-50'
                                }`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h4 className={`text-sm font-bold transition-all ${isCompleted ? 'text-slate-400 decoration-slate-300' : 'text-slate-800'}`}>
                                                {task.title}
                                            </h4>
                                        </div>
                                        <p className={`text-xs font-medium ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {task.description}
                                        </p>

                                        <div className="flex items-center flex-wrap gap-2 mt-3">
                                            {isCompleted ? (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${hasProgress && p.current >= p.target ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                    <Check size={10} strokeWidth={3} /> {hasProgress && p.current >= p.target ? "Veriyle doğrulanarak tamamlandı" : "Manuel tamamlandı"}
                                                </span>
                                            ) : hasProgress ? (
                                                isVerified ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5">
                                                        <Check size={10} strokeWidth={3} /> Veriyle doğrulandı
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1.5">
                                                        <Activity size={10} strokeWidth={3} /> Devam ediyor
                                                    </span>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                                        Manuel görev
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">Bu görev beyanla tamamlanır.</span>
                                                </div>
                                            )}
                                        </div>

                                        {p && (
                                            <div className="mt-3 max-w-sm">
                                                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                                    <span className="text-slate-500 uppercase tracking-wider">{p.label}</span>
                                                    <span className={
                                                        p.current >= p.target 
                                                            ? "text-emerald-500" 
                                                            : "text-slate-500"
                                                    }>
                                                        {p.current} / {p.target}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${
                                                            p.current >= p.target 
                                                                ? 'bg-emerald-500' 
                                                                : 'bg-blue-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, Math.round((p.current / p.target) * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <div className={`text-[10px] font-black tracking-tight px-2 py-0.5 rounded shadow-sm ${isCompleted ? 'text-slate-400 bg-slate-100 border border-slate-200' : 'text-white bg-slate-900 border border-slate-700'}`}>
                                            +{task.xp_reward} XP
                                        </div>
                                        
                                        {!isCompleted && task.status !== 'skipped' && (
                                            <div className="flex flex-col items-end gap-1.5 mt-1">
                                                <button 
                                                    onClick={() => onComplete(task.id)}
                                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                                        isVerified 
                                                            ? 'bg-[#00D2B4] text-white shadow-sm shadow-[#00D2B4]/20 hover:bg-[#00BFA5]' 
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                                    }`}
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    {isVerified ? "Onayla ve XP Al" : "Tamamla"}
                                                </button>
                                                <button 
                                                    onClick={() => onSkip(task.id)}
                                                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold transition-colors px-2 py-1"
                                                >
                                                    Atla
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
