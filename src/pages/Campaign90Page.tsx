import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { campaign90Service } from '../services/campaign90Service';
import { getCampaignTaskProgress } from '../services/campaignProgressService';
import { getGlossaryForDay } from '../data/campaignDayExpansions';
import { getCurriculumForDay } from '../data/campaignEducationCurriculum';
import { getTodayStr, getTodayStrFromDate } from '../services/core/utils';
import { CampaignTask, UserProfile } from '../types';
import { CAMPAIGN_90_DAYS } from '../data/campaign90Template';

import { useCampaign90Stats } from '../hooks/useCampaign90Stats';
import { useCampaign90Report } from '../hooks/useCampaign90Report';
import { getCampaignCoachMessage } from '../utils/campaign90Coach';
import { CampaignTaskGroup } from '../components/campaign90/CampaignTaskGroup';
import { CampaignStartWizard } from '../components/campaign90/CampaignStartWizard';
import { CampaignMentorCard } from '../components/campaign90/CampaignMentorCard';
import { Campaign90Tour } from '../components/campaign90/Campaign90Tour';
import { advisorProfileService } from '../services/advisorProfileService';
import { AdvisorProfessionalProfile } from '../types';
import { CampaignTodayFlowCard } from '../components/campaign90/CampaignTodayFlowCard';
import { CampaignEducationCard } from '../components/campaign90/CampaignEducationCard';
import { CampaignGlossaryCard } from '../components/campaign90/CampaignGlossaryCard';
import { CampaignTopStats, CampaignProfessionalGuides } from '../components/campaign90/CampaignLayoutElements';
import { CampaignReportCard } from '../components/campaign90/CampaignReportCard';
import { BookOpen, Target, Briefcase, Compass, Award } from 'lucide-react';


const getPhaseName = (week: number) => {
    if (week === 1) return "Sünger Modu";
    if (week <= 4) return "Saha ve Portföy Temelleri";
    if (week <= 8) return "Hızlanma";
    return "Master Seviye";
};

const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export const Campaign90Page: React.FC = () => {
    const queryClient = useQueryClient();
    
    // Auth user
    const { data: user } = useQuery({
       queryKey: ['auth_user'],
       queryFn: async () => {
           const s = await supabase.auth.getSession();
           return s.data.session?.user;
       }
    });

    const { data: profile } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            return data as UserProfile | null;
        },
        enabled: !!user?.id
    });

    const { data: advisorProfile } = useQuery({
        queryKey: ['advisor_professional_profile', user?.id],
        queryFn: () => advisorProfileService.getAdvisorProfessionalProfile(user!.id),
        enabled: !!user?.id
    });

    const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
        queryKey: ['campaign90_active', user?.id],
        queryFn: () => campaign90Service.getActiveCampaign(user!.id),
        enabled: !!user?.id
    });

    const todayStr = getTodayStr(new Date());

    const { data: tasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['campaign90_tasks', campaign?.id, todayStr],
        queryFn: () => campaign90Service.getTodayCampaignTasks(user!.id, todayStr),
        enabled: !!campaign?.id && !!user?.id
    });

    const { data: taskProgressMap } = useQuery({
        queryKey: ['campaign_task_progress', user?.id, todayStr, tasks ? tasks.length : 0],
        queryFn: () => getCampaignTaskProgress(user!.id, tasks || [], new Date()),
        enabled: !!user?.id && !!tasks && tasks.length > 0
    });

    const { data: progress } = useQuery({
        queryKey: ['campaign90_progress', campaign?.id],
        queryFn: () => campaign90Service.getCampaignProgress(campaign!.id),
        enabled: !!campaign?.id
    });

    const { data: crmStats } = useCampaign90Stats(user?.id);
    const { data: campaignReport } = useCampaign90Report(user?.id, campaign);

    const startMutation = useMutation({
        mutationFn: async (payload: Partial<AdvisorProfessionalProfile>) => {
            if (!user?.id) throw new Error("No user");
            
            // Upsert profile
            await advisorProfileService.upsertAdvisorProfessionalProfile({
                ...payload,
                user_id: user.id
            });

            // Update main profile district if changed
            if (profile?.id && payload.region) {
                await supabase.from('profiles').update({ 
                    district: payload.region,
                    expertise_areas: payload.niche ? [payload.niche] : profile.expertise_areas
                }).eq('id', profile.id);
            }

            // Start campaign
            return campaign90Service.startCampaign({ 
                region: payload.region || undefined, 
                niche: payload.niche || undefined,
                daily_contact_target: payload.daily_contact_target || undefined,
                weekly_contact_target: payload.weekly_contact_target || undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign90_active'] });
            toast.success("Kamp başarıyla başlatıldı!");
        },
        onError: (err: unknown) => {
            console.error("Start campaign error:", err);
            const msg = getErrorMessage(err, "Kamp başlatılırken bir hata oluştu.");
            toast.error(msg);
        }
    });

    const completeTaskMutation = useMutation({
        mutationFn: async (taskId: string) => campaign90Service.completeCampaignTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign90_tasks'] });
            queryClient.invalidateQueries({ queryKey: ['campaign90_progress'] });
            toast.success("Görev başarıyla tamamlandı!");
        },
        onError: (err: unknown) => {
            console.error("Complete task error:", err);
            toast.error(getErrorMessage(err, "Görev tamamlanırken bir hata oluştu."));
        }
    });

    const skipTaskMutation = useMutation({
        mutationFn: async (taskId: string) => campaign90Service.skipCampaignTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign90_tasks'] });
            queryClient.invalidateQueries({ queryKey: ['campaign90_progress'] });
            toast.success("Görev atlandı.");
        },
        onError: (err: unknown) => {
            console.error("Skip task error:", err);
            toast.error(getErrorMessage(err, "Görev atlanırken bir hata oluştu."));
        }
    });

    if (isLoadingCampaign) {
        return <div className="p-8 flex justify-center text-slate-500">Yükleniyor...</div>;
    }

    if (!campaign) {
        return (
            <CampaignStartWizard
                mode="campaign_start"
                isPending={startMutation.isPending}
                onComplete={(payload) => startMutation.mutate(payload)}
            />
        );
    }

    const todayISO = getTodayStrFromDate(new Date());
    const dayStartTimestamp = profile?.last_day_started_at || '';
    const isDayStarted = profile?.last_day_started_at && getTodayStrFromDate(new Date(profile.last_day_started_at)) === todayISO;
    const isDayClosed = !!(profile?.last_ritual_completed_at && getTodayStrFromDate(new Date(profile.last_ritual_completed_at)) === todayISO && profile.last_ritual_completed_at > dayStartTimestamp);
    
    const dayStatus = !isDayStarted ? 'not_started' : isDayClosed ? 'closed' : 'active';

    const todayTasks = tasks || [];
    const todayG = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'G' && t.status === 'completed').length || 0;
    const todayP = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'P' && t.status === 'completed').length || 0;
    const todayA = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'A' && t.status === 'completed').length || 0;
    const todayCompleted = todayTasks.filter((t: CampaignTask) => t.status === 'completed').length || 0;
    const todayTotal = todayTasks.length;
    const todayScore = (todayG * 3) + (todayP * 5) + (todayA * 2);

    const completedPercent = progress?.total ? Math.round((progress.completed / progress.total) * 100) : 0;
    const phaseName = getPhaseName(campaign.current_week);

    // Group tasks
    const eduTasks = todayTasks.filter((t: CampaignTask) => t.task_key.includes('_edu'));
    const gTasks = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'G' && !t.task_key.includes('_edu') && t.task_type !== 'review');
    const pTasks = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'P' && !t.task_key.includes('_edu') && t.task_type !== 'review');
    const aTasks = todayTasks.filter((t: CampaignTask) => t.gpa_bucket === 'A' && !t.task_key.includes('_edu') && t.task_type !== 'review' && !t.task_key.includes('_rev'));
    const reviewTasks = todayTasks.filter((t: CampaignTask) => t.task_type === 'review' || t.task_key.includes('_rev'));

    const coachMessage = getCampaignCoachMessage({
        todayTotal,
        todayCompleted,
        todayG,
        todayP,
        todayA,
        currentDay: campaign.current_day,
        taskProgressMap,
        todayTasks,
        crmStats,
        dayStatus
    });

    const verifiedPendingCount = todayTasks.filter(t => {
        if (t.status === 'completed') return false;
        const p = taskProgressMap?.[t.id];
        return p && p.current >= p.target;
    }).length;

    const currentDayTemplate = CAMPAIGN_90_DAYS.find(d => d.day_number === campaign.current_day);
    const glossary = getGlossaryForDay(campaign.current_day);
    const curriculum = getCurriculumForDay(campaign.current_day, advisorProfile?.experience_level);

    const handleCompleteTask = (taskId: string) => completeTaskMutation.mutate(taskId);
    const handleSkipTask = (taskId: string) => skipTaskMutation.mutate(taskId);

    return (
        <div className="w-full max-w-[1300px] mx-auto p-4 md:p-8 pb-32 min-w-0 overflow-x-hidden">
            <div className="flex items-end gap-3 mb-5">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        {currentDayTemplate ? currentDayTemplate.day_title : `Gün ${campaign.current_day} Görevleri`}
                    </h1>
                    <p className="text-sm font-bold text-slate-500 mt-1">Hafta {campaign.current_week}: {currentDayTemplate?.phase_title || phaseName}</p>
                </div>
            </div>

            <div className="flex flex-col gap-5 min-w-0">
                {/* 1. Top Summary: Campaign Progress + Today's GPA */}
                <div data-tour="campaign-progress">
                    <CampaignTopStats 
                        currentDay={campaign.current_day}
                        completedPercent={completedPercent}
                        todayCompleted={todayCompleted}
                        todayTotal={todayTotal}
                        todayG={todayG}
                        todayP={todayP}
                        todayA={todayA}
                        todayScore={todayScore}
                        cumulativeScore={progress?.gpaScore || 0}
                        dayStatus={dayStatus as 'active' | 'closed' | 'not_started'}
                    />
                </div>

                {/* 2. Portfy Mentor / Field Coach Message */}
                <div data-tour="campaign-mentor">
                    <CampaignMentorCard message={coachMessage} />
                </div>

                {/* 3. Today's Rank */}
                <div data-tour="campaign-today-flow">
                    <CampaignTodayFlowCard 
                        requiredTotal={todayTotal - reviewTasks.length}
                        requiredCompleted={todayCompleted - reviewTasks.filter(t => t.status === 'completed').length}
                        verifiedPendingCount={verifiedPendingCount}
                        dayStatus={dayStatus as 'active' | 'closed' | 'not_started'}
                    />
                </div>

                {/* 4. Daily Education */}
                {currentDayTemplate && (
                    <div data-tour="campaign-education">
                        <CampaignEducationCard curriculum={curriculum} />
                    </div>
                )}

                {/* 5. Glossary */}
                {currentDayTemplate && (
                    <div data-tour="campaign-glossary">
                        <CampaignGlossaryCard glossary={glossary} />
                    </div>
                )}

                {/* 6. Daily Campaign Tasks */}
                <div className="pt-0 flex flex-col gap-3" data-tour="campaign-tasks">
                    <h2 className="text-xl font-black text-slate-900 mb-1 mt-2">Bugünün Kamp Görevleri</h2>
                    {isLoadingTasks ? (
                        <div className="py-8 text-center text-slate-500 font-medium">Görevler yükleniyor...</div>
                    ) : tasks && tasks.length > 0 ? (
                        <>
                            <CampaignTaskGroup 
                                title="Günün Dersi & Hazırlık" 
                                icon={BookOpen} 
                                tasks={eduTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                colorClass="bg-slate-100 text-slate-600" 
                                progressMap={taskProgressMap} 
                            />
                            <CampaignTaskGroup 
                                title="Gelir Getirici Aktiviteler" 
                                icon={Target} 
                                tasks={gTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                colorClass="bg-blue-100 text-blue-600" 
                                progressMap={taskProgressMap} 
                            />
                            <CampaignTaskGroup 
                                title="Portföy Üretimi" 
                                icon={Briefcase} 
                                tasks={pTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                colorClass="bg-purple-100 text-purple-600" 
                                progressMap={taskProgressMap} 
                            />
                            <CampaignTaskGroup 
                                title="Alan Uzmanlığı" 
                                icon={Compass} 
                                tasks={aTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                defaultOpen={false} 
                                colorClass="bg-orange-100 text-orange-600" 
                                progressMap={taskProgressMap} 
                            />
                            <CampaignTaskGroup 
                                title="Gün Sonu Kapanışı" 
                                icon={Award} 
                                tasks={reviewTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                defaultOpen={false} 
                                colorClass="bg-emerald-100 text-emerald-600" 
                                progressMap={taskProgressMap} 
                            />
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            Bugün için bir görev atanmamış.
                        </div>
                    )}
                </div>

                {/* 7. Campaign Development Report */}
                <div data-tour="campaign-report-guides" className="flex flex-col gap-5">
                    {campaignReport && (
                        <CampaignReportCard report={campaignReport} crmStats={crmStats} />
                    )}

                    {/* 8. Professional Guides accordion */}
                    <CampaignProfessionalGuides />
                </div>
            </div>
            
            {user?.id && campaign?.id && (
                <Campaign90Tour userId={user.id} campaignId={campaign.id} />
            )}
        </div>
    );
};
