import React from 'react';
import { Card } from '../UI';
import { Target } from 'lucide-react';

interface Props {
    requiredTotal: number;
    requiredCompleted: number;
    verifiedPendingCount: number;
    dayStatus?: 'active' | 'closed' | 'not_started';
}

export const CampaignTodayFlowCard: React.FC<Props> = ({
    requiredTotal,
    requiredCompleted,
    verifiedPendingCount,
    dayStatus = 'not_started'
}) => {
    return (
        <Card className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                <div>
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <Target size={14} className="text-indigo-500" />
                        Bugünün Sırası
                    </h3>
                </div>
                
                {(() => {
                    if (verifiedPendingCount > 0) {
                        return <div className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex max-w-max shrink-0">{verifiedPendingCount} onay beklemede</div>;
                    } else if (requiredTotal > 0 && requiredCompleted === 0) {
                        return <div className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md inline-flex max-w-max shrink-0">Başlangıç: Eğitimi oku & göreve başla</div>;
                    } else if (requiredTotal > 0 && requiredCompleted < requiredTotal) {
                        return <div className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-md inline-flex max-w-max shrink-0">Zorunlu görevlere devam et</div>;
                    } else if (requiredTotal > 0 && requiredCompleted >= requiredTotal) {
                        return <div className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-md inline-flex max-w-max shrink-0">Harika! Sonuca odaklan</div>;
                    }
                    return null;
                })()}
            </div>

            <div className="flex flex-row overflow-x-auto pb-1 scrollbar-hide items-center gap-2 text-[10px] text-slate-600 font-bold min-w-0">
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 mx-auto rounded flex items-center justify-center text-[9px]">1</span>
                    <span className="whitespace-nowrap">
                        {dayStatus === 'not_started' ? "Günü başlat" : dayStatus === 'closed' ? "Yarına hazırlan" : "Eğitimi oku"}
                    </span>
                </div>
                <div className="w-2 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 mx-auto rounded flex items-center justify-center text-[9px]">2</span>
                    <span className="whitespace-nowrap">Görevleri bitir</span>
                </div>
                <div className="w-2 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 mx-auto rounded flex items-center justify-center text-[9px]">3</span>
                    <span className="whitespace-nowrap">Görev onayı</span>
                </div>
                <div className="w-2 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 mx-auto rounded flex items-center justify-center text-[9px]">4</span>
                    <span className="whitespace-nowrap">Uyarılar</span>
                </div>
                <div className="w-2 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-700 mx-auto rounded flex items-center justify-center text-[9px]">5</span>
                    <span className="whitespace-nowrap">Kapanış yap</span>
                </div>
            </div>
        </Card>
    );
};
