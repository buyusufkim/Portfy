import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

interface Props {
    glossary: { term: string; meaning: string; example?: string }[];
}

export const CampaignGlossaryCard: React.FC<Props> = ({ glossary }) => {
    if (!glossary || glossary.length === 0) return null;

    return (
        <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden open:pb-3">
            <summary className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-purple-500 shrink-0"/> 
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                        <h3 className="text-sm font-black text-slate-800">Günün 5 Terimi</h3>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Mesleki Sözlük</span>
                    </div>
                </div>
                <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform"/>
            </summary>
            <div className="px-4 border-t border-slate-100 flex flex-col gap-3 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {glossary.map((g, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                            <div className="text-[11px] font-black text-slate-900">{g.term}</div>
                            <div className="text-[10px] text-slate-600 font-medium leading-snug">{g.meaning}</div>
                            {g.example && <div className="text-[9px] text-slate-400 italic mt-0.5 border-t border-slate-100 pt-0.5">Örn: "{g.example}"</div>}
                        </div>
                    ))}
                </div>
            </div>
        </details>
    );
};
