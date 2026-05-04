import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

interface Props {
    glossary: { term: string; meaning: string; example?: string }[];
}

export const CampaignGlossaryCard: React.FC<Props> = ({ glossary }) => {
    if (!glossary || glossary.length === 0) return null;

    return (
        <details className="group bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden open:pb-4">
            <summary className="p-4 px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><BookOpen size={16} className="text-purple-500"/> Günün 5 Terimi (Sözlük)</h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Meslek dilini öğren ve kullan</p>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform"/>
            </summary>
            <div className="px-6 border-t border-slate-100 flex flex-col gap-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {glossary.map((g, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-sm font-black text-slate-900 mb-1">{g.term}</div>
                            <div className="text-[12px] text-slate-600 font-medium leading-relaxed">{g.meaning}</div>
                            {g.example && <div className="text-[11px] text-slate-400 italic mt-1.5 border-t border-slate-200 pt-1.5">Örn: "{g.example}"</div>}
                        </div>
                    ))}
                </div>
            </div>
        </details>
    );
};
