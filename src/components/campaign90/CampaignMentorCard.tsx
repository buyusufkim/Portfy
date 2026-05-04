import React from 'react';
import { Card } from '../UI';
import { Play } from 'lucide-react';

export const CampaignMentorCard: React.FC<{ message: string }> = ({ message }) => {
    return (
        <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl flex gap-4 items-center shadow-sm">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-orange-100 flex items-center justify-center shrink-0">
               <Play size={20} className="fill-orange-500 text-orange-500" />
            </div>
            <div>
               <h4 className="text-[11px] uppercase tracking-wider font-black text-orange-800/60 mb-1">Portfy Mentor</h4>
               <p className="text-sm font-bold text-orange-900 leading-snug">{message}</p>
            </div>
        </Card>
    );
};
