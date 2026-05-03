import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../UI';
import { Trophy, ArrowRight, Activity, Target } from 'lucide-react';
import { campaign90Service } from '../../services/campaign90Service';

export const Campaign90MiniCard: React.FC<{ userId: string; setActiveTab?: (tab: string) => void }> = ({ userId, setActiveTab }) => {
  const { data: campaign } = useQuery({
    queryKey: ['campaign90_active', userId],
    queryFn: () => campaign90Service.getActiveCampaign(userId),
    enabled: !!userId,
  });

  const { data: progress } = useQuery({
    queryKey: ['campaign90_progress', campaign?.id],
    queryFn: () => campaign90Service.getCampaignProgress(campaign!.id),
    enabled: !!campaign?.id,
  });

  if (!campaign) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-[0_8px_24px_rgba(15,23,42,0.1)] overflow-hidden rounded-[24px] relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <Trophy size={64} className="text-white" />
      </div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
            <Trophy size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">90 Günlük Danışman Kampı</h3>
            <p className="text-[10px] text-slate-300 font-medium">İlk 90 gün kampı devrede</p>
          </div>
        </div>
        <div className="text-right">
           <div className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-lg">Gün {campaign.current_day}/90</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mb-1">
            <Target size={12} />
            Haftalık Tamamlanma
          </div>
          <div className="flex items-end gap-1">
             <span className="text-lg font-black text-white leading-none">{progress?.completed || 0}</span>
             <span className="text-xs text-slate-400 font-bold mb-0.5">/ {progress?.total || 0}</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mb-1">
            <Activity size={12} />
            GPA Skoru
          </div>
          <div className="flex items-end gap-1">
             <span className="text-lg font-black text-white leading-none">{progress?.gpaScore || 0}</span>
             <span className="text-[10px] text-slate-400 font-bold mb-0.5 ml-1 bg-white/10 px-1.5 py-0.5 rounded">puan</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setActiveTab?.('campaign-90')}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 relative z-10"
      >
        Kampa Git <ArrowRight size={14} />
      </button>
    </Card>
  );
};
