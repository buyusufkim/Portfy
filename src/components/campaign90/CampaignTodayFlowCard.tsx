import React from 'react';
import { Card } from '../UI';
import { Target } from 'lucide-react';

interface Props {
    requiredTotal: number;
    requiredCompleted: number;
    verifiedPendingCount: number;
}

export const CampaignTodayFlowCard: React.FC<Props> = ({
    requiredTotal,
    requiredCompleted,
    verifiedPendingCount
}) => {
    return (
        <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Target size={16} className="text-indigo-500" />
                        Bugünün Sırası
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Bugün kampı tamamlamak için şu sırayı izle.</p>
                </div>
                
                {(() => {
                    if (verifiedPendingCount > 0) {
                        return <div className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex max-w-max shrink-0">{verifiedPendingCount} görev onay bekliyor</div>;
                    } else if (requiredTotal > 0 && requiredCompleted === 0) {
                        return <div className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg inline-flex max-w-max shrink-0">Başlangıç: Dersi oku ve ilk görevini seç</div>;
                    } else if (requiredTotal > 0 && requiredCompleted < requiredTotal) {
                        return <div className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg inline-flex max-w-max shrink-0">Önce zorunlu görevleri bitir</div>;
                    } else if (requiredTotal > 0 && requiredCompleted >= requiredTotal) {
                        return <div className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-2.5 py-1 rounded-lg inline-flex max-w-max shrink-0">Harika! Gün sonuna odaklanabilirsin</div>;
                    }
                    return null;
                })()}
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap 2xl:flex-nowrap md:items-center justify-between gap-3 text-xs md:text-[11px] lg:text-xs text-slate-600 font-bold min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                    <span className="whitespace-normal break-words leading-tight">Günün eğitimini oku</span>
                </div>
                <div className="hidden md:block w-4 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">2</span>
                    <span className="whitespace-normal break-words leading-tight">Zorunlu görevleri tamamla</span>
                </div>
                <div className="hidden md:block w-4 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">3</span>
                    <span className="whitespace-normal break-words leading-tight">Doğrulanan görevleri onayla</span>
                </div>
                <div className="hidden md:block w-4 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">4</span>
                    <span className="whitespace-normal break-words leading-tight">Uyarıları kontrol et</span>
                </div>
                <div className="hidden md:block w-4 h-px bg-slate-200 shrink-0"></div>
                
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 flex-shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">5</span>
                    <span className="whitespace-normal break-words leading-tight">Kapanış yap</span>
                </div>
            </div>
        </Card>
    );
};
