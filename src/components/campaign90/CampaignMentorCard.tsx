import React from 'react';
import { Card } from '../UI';
import { Play } from 'lucide-react';

export const CampaignMentorCard: React.FC<{ message: string }> = ({ message }) => {
    return (
        <Card className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl flex gap-3 items-center shadow-sm">
            <div className="w-8 h-8 bg-white rounded-xl shadow-sm border border-orange-100 flex items-center justify-center shrink-0">
               <Play size={14} className="fill-orange-500 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
               <h4 className="text-[9px] uppercase tracking-wider font-black text-orange-800/60 mb-0.5">Portfy Mentor</h4>
               <p className="text-xs font-bold text-orange-900 leading-snug line-clamp-2" title={message}>{message}</p>
            </div>
        </Card>
    );
};
