import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../UI';
import { Trophy, ArrowRight, Activity, Target } from 'lucide-react';
import { campaign90Service } from '../../services/campaign90Service';
import { getTodayStr } from '../../services/core/utils';
import { CampaignTask } from '../../types';

export const Campaign90MiniCard: React.FC<{ userId: string; setActiveTab?: (tab: string) => void }> = ({ userId, setActiveTab }) => {
  const { data: campaign } = useQuery({
    queryKey: ['campaign90_active', userId],
    queryFn: () => campaign90Service.getActiveCampaign(userId),
    enabled: !!userId,
  });

  const todayStr = getTodayStr(new Date());

  const { data: tasks } = useQuery({
      queryKey: ['campaign90_tasks', campaign?.id, todayStr],
      queryFn: () => campaign90Service.getTodayCampaignTasks(userId, todayStr),
      enabled: !!campaign?.id && !!userId
  });

  if (!campaign) return null;

  const todayTasks = tasks || [];
  const todayG = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'G' && t.status === 'completed').length || 0;
  const todayP = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'P' && t.status === 'completed').length || 0;
  const todayA = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'A' && t.status === 'completed').length || 0;
  const todayCompleted = todayTasks.filter((t: CampaignTask) => t.status === 'completed').length || 0;
  const todayTotal = todayTasks.length;
  const todayScore = (todayG * 3) + (todayP * 5) + (todayA * 2);

  return (
    <div className="p-4 bg-slate-900 border-none shadow-xl overflow-hidden rounded-[24px] relative group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-10 transition-opacity">
         <Trophy size={80} className="text-white" />
      </div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#00D2B4]/20 p-2 rounded-xl border border-[#00D2B4]/30">
            <Trophy size={18} className="text-[#00D2B4]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">90 Günlük Kamp</h3>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Dijital Mentor</p>
          </div>
        </div>
        <div className="text-right">
           <div className="text-xs font-black text-white bg-white/10 px-2 py-1 rounded-xl whitespace-nowrap">Gün {campaign.current_day}/90</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
        <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
          <div className="text-[10px] text-[#00D2B4] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Target size={12} />
            Bugünkü Görev
          </div>
          <div className="flex items-end gap-1">
             <span className="text-xl font-black text-white leading-none">{todayCompleted}</span>
             <span className="text-xs text-white/60 font-bold mb-0.5">/ {todayTotal}</span>
          </div>
        </div>
        <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
          <div className="text-[10px] text-[#00D2B4] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Activity size={12} />
            Bugünkü GPA
          </div>
          <div className="flex items-end gap-1">
             <span className="text-xl font-black text-white leading-none">{todayScore}</span>
             <span className="text-[10px] text-white/60 font-bold mb-0.5 ml-0.5">puan</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setActiveTab?.('campaign-90')}
        className="w-full bg-[#00D2B4] hover:bg-[#00e3c5] text-[#061A32] font-black text-sm py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 relative z-10"
      >
        Kampa Git <ArrowRight size={16} />
      </button>
    </div>
  );
};
