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
import { campaign90ContentService } from '../services/campaign90ContentService';
import { campaign90AnswerService } from '../services/campaign90AnswerService';
import { mergeCampaignDayContentWithFallback } from '../utils/campaign90ContentMergeHelpers';
import { normalizeQuestionKey } from '../utils/campaign90AnswerHelpers';
import { CampaignTaskGroup } from '../components/campaign90/CampaignTaskGroup';
import { CampaignStartWizard } from '../components/campaign90/CampaignStartWizard';
import { CampaignMentorCard } from '../components/campaign90/CampaignMentorCard';
import { Campaign90Tour } from '../components/campaign90/Campaign90Tour';
import { advisorProfileService } from '../services/advisorProfileService';
import { AdvisorProfessionalProfile } from '../types';
import { CampaignTodayFlowCard } from '../components/campaign90/CampaignTodayFlowCard';
import { CampaignEducationCard } from '../components/campaign90/CampaignEducationCard';
import { CampaignGlossaryCard } from '../components/campaign90/CampaignGlossaryCard';
import { useAuth } from '../AuthContext';
import { CampaignTopStats, CampaignProfessionalGuides } from '../components/campaign90/CampaignLayoutElements';
import { CampaignReportCard } from '../components/campaign90/CampaignReportCard';
import { BookOpen, Target, Briefcase, Compass, Award } from 'lucide-react';
import { CampaignTaskCompletionModal, getCampaignTaskCompletionMode, CampaignTaskCompletionMode } from '../components/campaign90/CampaignTaskCompletionModal';


const getPhaseName = (week: number) => {
    if (week === 1) return "Sünger Modu";
    if (week <= 4) return "Saha ve Portföy Temelleri";
    if (week <= 8) return "Hızlanma";
    return "Master Seviye";
};

const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export const Campaign90Page: React.FC = () => {
    const queryClient = useQueryClient();
    const { subscribe } = useAuth();
    
    const [selectedTaskForModal, setSelectedTaskForModal] = useState<{task: CampaignTask, mode: CampaignTaskCompletionMode} | null>(null);
    const [isCompletingWithModal, setIsCompletingWithModal] = useState(false);
    const [selectedDayState, setSelectedDayState] = useState<number | null>(null);

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

    const currentCampaignDay = campaign?.current_day || 1;
    const selectedDay = selectedDayState ?? currentCampaignDay;

    const todayStr = getTodayStr(new Date());

    const targetDate = React.useMemo(() => {
        if (!campaign?.start_date) return new Date();
        const start = new Date(campaign.start_date);
        start.setDate(start.getDate() + (selectedDay - 1));
        return start;
    }, [campaign?.start_date, selectedDay]);

    const targetDateStr = getTodayStr(targetDate);

    const { data: tasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['campaign90_tasks', campaign?.id, selectedDay],
        queryFn: () => selectedDay === currentCampaignDay ? campaign90Service.getTodayCampaignTasks(user!.id, todayStr) : campaign90Service.getCampaignTasksByDay(campaign!.id, selectedDay),
        enabled: !!campaign?.id && !!user?.id
    });

    const { data: taskProgressMap } = useQuery({
        queryKey: ['campaign_task_progress', user?.id, targetDateStr, tasks ? tasks.length : 0],
        queryFn: () => getCampaignTaskProgress(user!.id, tasks || [], targetDate),
        enabled: !!user?.id && !!tasks && tasks.length > 0
    });

    const { data: progress } = useQuery({
        queryKey: ['campaign90_progress', campaign?.id],
        queryFn: () => campaign90Service.getCampaignProgress(campaign!.id),
        enabled: !!campaign?.id
    });

    const { data: crmStats } = useCampaign90Stats(user?.id);
    const { data: campaignReport } = useCampaign90Report(user?.id, campaign);

    const { data: cmsContent, isLoading: isLoadingCms } = useQuery({
        queryKey: ['campaign90_cms_content', selectedDay],
        queryFn: () => campaign90ContentService.getPublishedDayContent(selectedDay)
    });

    const { data: savedAnswers, isLoading: isLoadingAnswers, refetch: refetchAnswers } = useQuery({
        queryKey: ['campaign90_day_answers', selectedDay],
        queryFn: () => campaign90AnswerService.fetchMyCampaign90DayAnswers(selectedDay),
        staleTime: 0
    });

    const [answers, setAnswers] = React.useState<Record<string, string>>({});
    const [isSavingAnswers, setIsSavingAnswers] = React.useState(false);

    React.useEffect(() => {
        if (savedAnswers) {
            setAnswers(savedAnswers);
        } else {
            setAnswers({}); // reset if empty/new
        }
    }, [savedAnswers, selectedDay]);

    const startMutation = useMutation({
        mutationFn: async (payload: Partial<AdvisorProfessionalProfile>) => {
            if (!user?.id) throw new Error("No user");
            
            let isSubscribedToPro = profile?.subscription_type && profile.subscription_type !== 'none';
            if (!isSubscribedToPro) {
                const res = await subscribe('trial');
                if (res) {
                    isSubscribedToPro = true;
                } else {
                   throw new Error("trial_ended");
                }
            }

            // Upsert profile
            await advisorProfileService.upsertAdvisorProfessionalProfile({
                ...payload,
                user_id: user.id
            });

            // Update main profile district if changed
            if (profile?.id && (payload.region || payload.niche)) {
                const targetUpdate: any = {};
                if (payload.region) {
                    const parts = payload.region.split('/').map(p => p.trim());
                    targetUpdate.district = payload.region;
                    targetUpdate.region = { 
                        city: parts[0] || '', 
                        district: parts[1] || payload.region, 
                        neighborhoods: parts[2] ? parts[2].split(',').map(n => n.trim()) : [] 
                    };
                }
                if (payload.niche) {
                    targetUpdate.expertise_areas = payload.niche.split(',').map(x => x.trim());
                }
                await supabase.from('profiles').update(targetUpdate).eq('id', profile.id);
            }

            // Start campaign
            const res = await campaign90Service.startCampaign({ 
                region: payload.region || undefined, 
                niche: payload.niche || undefined,
                daily_contact_target: payload.daily_contact_target || undefined,
                weekly_contact_target: payload.weekly_contact_target || undefined
            });

            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign90_active'] });
            toast.success("Kamp başarıyla başlatıldı!");
        },
        onError: (err: Error | unknown) => {
            console.error("Start campaign error:", err);
            if (err instanceof Error && err.message === 'trial_ended') {
                toast.error("Kampı başlatmak için Pro pakete geçmen gerekiyor.", { duration: 4000 });
            } else {
                toast.error(getErrorMessage(err, "Kamp başlatılırken bir hata oluştu."));
            }
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

    const currentDayTemplate = CAMPAIGN_90_DAYS.find(d => d.day_number === selectedDay);
    const fallbackGlossary = getGlossaryForDay(selectedDay);
    const fallbackCurriculum = getCurriculumForDay(selectedDay, advisorProfile?.experience_level);

    const mergedContent = mergeCampaignDayContentWithFallback(
        cmsContent, 
        currentDayTemplate, 
        fallbackCurriculum, 
        fallbackGlossary, 
        selectedDay
    );

    const handleCompleteTask = (taskId: string) => {
        if (selectedDay < currentCampaignDay) {
            toast.error("Geçmiş günlerde görev tamamlayamazsın.");
            return;
        }

        const task = tasks?.find((t: CampaignTask) => t.id === taskId);
        if (!task) return;
        
        const mode = getCampaignTaskCompletionMode(task);
        if (mode === 'instant') {
            completeTaskMutation.mutate(taskId);
        } else {
            setSelectedTaskForModal({ task, mode });
        }
    };

    const handleModalSubmit = async (formData: Record<string, any>) => {
        if (!selectedTaskForModal) return;
        if (selectedDay < currentCampaignDay) {
            toast.error("Geçmiş günlerde bilgi girişi yapılamaz.");
            return;
        }
        const task = selectedTaskForModal.task;
        setIsCompletingWithModal(true);

        try {
            // Save evidence to advisor profile metadata
            if (advisorProfile) {
                const currentMeta = (typeof advisorProfile.metadata === 'object' && advisorProfile.metadata) ? advisorProfile.metadata : {};
                const currentEvidence = currentMeta.campaign_task_evidence && typeof currentMeta.campaign_task_evidence === 'object' ? currentMeta.campaign_task_evidence : {};
                const newEvidence = { ...currentEvidence } as Record<string, any>;
                
                newEvidence[task.task_key] = {
                    ...formData,
                    completedAt: new Date().toISOString()
                };

                const updatePayload: Partial<AdvisorProfessionalProfile> = {
                    metadata: { ...currentMeta, campaign_task_evidence: newEvidence }
                };

                // Update specific office/myk fields if applicable
                if (selectedTaskForModal.mode === 'office_info_required') {
                    updatePayload.office_name = formData.officeName;
                    if (formData.brand) updatePayload.office_brand = formData.brand;
                }

                if (selectedTaskForModal.mode === 'document_info_required') {
                    if (formData.documentType === 'MYK' && formData.status === 'Tamamlandi') {
                        updatePayload.has_myk = true;
                    } else if (formData.documentType === 'Yetki' && formData.status === 'Tamamlandi') {
                        updatePayload.has_real_estate_authorization = true;
                    }
                }

                await advisorProfileService.upsertAdvisorProfessionalProfile({
                    ...advisorProfile,
                    ...updatePayload
                });
            }

            // Now complete the task
            await campaign90Service.completeCampaignTask(task.id);
            
            queryClient.invalidateQueries({ queryKey: ['campaign90_tasks'] });
            queryClient.invalidateQueries({ queryKey: ['campaign90_progress'] });
            queryClient.invalidateQueries({ queryKey: ['advisor_professional_profile'] });
            toast.success("Görev başarıyla kaydedildi ve tamamlandı!");
            setSelectedTaskForModal(null);
        } catch (err) {
            console.error("Modal submit error:", err);
            toast.error(getErrorMessage(err, "Görev kaydedilirken bir hata oluştu."));
        } finally {
            setIsCompletingWithModal(false);
        }
    };

    const handleSkipTask = (taskId: string) => {
        if (selectedDay < currentCampaignDay) {
            toast.error("Geçmiş günlerde görev atlayamazsın.");
            return;
        }
        skipTaskMutation.mutate(taskId);
    };

    const handleSaveAnswers = async () => {
        if (selectedDay < currentCampaignDay) {
            toast.error("Geçmiş günlerin cevapları değiştirilemez.");
            return;
        }
        setIsSavingAnswers(true);
        const success = await campaign90AnswerService.saveMyCampaign90DayAnswers(selectedDay, answers);
        setIsSavingAnswers(false);
        if (success) {
            toast.success("Cevaplarınız başarıyla kaydedildi.");
            refetchAnswers();
        } else {
            toast.error("Cevaplar kaydedilemedi.");
        }
    };

    const isRestrictedDay8 = selectedDay >= 8 && (!profile?.subscription_end_date || new Date(profile.subscription_end_date) < new Date()) && profile?.tier !== 'master' && profile?.tier !== 'pro' && profile?.tier !== 'elite';

    const handleUpgradeRequest = async () => {
        try {
            await supabase.from('webhook_events').insert({
                type: 'pro_package_request',
                payload: { user_id: user?.id, email: user?.email, source: 'campaign90_day8_lock' }
            });
            toast.success("Talebiniz alındı! Ekibimiz size ulaşacak.");
        } catch(e) {}
    }

    if (isRestrictedDay8) {
        return (
            <div className="w-full max-w-[1300px] mx-auto p-4 md:p-8 pb-32 min-w-0 overflow-x-hidden">
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
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDayState}
                />
                <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none -mt-10 -mr-10">
                        <Award size={240} className="text-amber-500" />
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">7 Günlük Deneme Süren Bitti</h2>
                        <p className="text-slate-300 font-medium mb-8 text-lg">
                            Harika gidiyorsun! 90 Gün Kampı'nın 8. günü ve sonrasına devam etmek, gelişmiş kamp raporlarına ve Portfy Pro özelliklerine erişmek için paketini aktif et.
                        </p>
                        <button 
                            onClick={handleUpgradeRequest}
                            className="bg-[#00D2B4] hover:bg-[#00e3c5] text-slate-900 font-black py-4 px-8 rounded-xl transition-colors shadow-lg shadow-[#00D2B4]/20"
                        >
                            Pro Paket Talebi Gönder
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1300px] mx-auto p-4 md:p-6 pb-24 min-w-0 overflow-x-hidden">
            <div className="flex items-center gap-3 mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {mergedContent.title}
                    </h1>
                    <p className="text-[13px] font-bold text-slate-500 mt-0.5">Hafta {campaign.current_week}: {mergedContent.phaseTitle || phaseName}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 min-w-0">
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
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDayState}
                    />
                </div>

                {selectedDay < currentCampaignDay && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center">
                        Geçmiş gün görüntüleniyor. Bu alanda değişiklik yapılamaz.
                    </div>
                )}

                {/* 2. Portfy Mentor / Field Coach Message */}
                <div data-tour="campaign-mentor">
                    <CampaignMentorCard message={mergedContent.isCmsActive && mergedContent.mentorMessage ? mergedContent.mentorMessage : coachMessage} />
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

                {/* Daily Video (CMS Only) */}
                {mergedContent.videoUrl && (
                    <div className="bg-slate-900 rounded-2xl overflow-hidden p-6 relative border border-slate-800" data-tour="campaign-video">
                        <div className="max-w-2xl">
                             <h3 className="text-xl font-bold text-white mb-2">{mergedContent.videoTitle || 'Günün Eğitimi'}</h3>
                             <p className="text-slate-400 text-sm mb-4">Bu video günün görevlerini daha iyi kavramanıza yardımcı olacaktır.</p>
                             <a 
                                href={mergedContent.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#00D2B4] hover:bg-[#00e3c5] text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors"
                             >
                                Videoyu İzle
                             </a>
                        </div>
                    </div>
                )}

                {/* 4. Daily Education */}
                {currentDayTemplate && (
                    <div data-tour="campaign-education">
                        <CampaignEducationCard 
                            curriculum={{
                                lesson_title: mergedContent.shortSummary,
                                module_title: mergedContent.moduleTitle,
                                learning_goals: mergedContent.learningGoals,
                                lesson_body: mergedContent.learningContent,
                                field_example: mergedContent.fieldExample,
                                common_mistake: mergedContent.commonMistake,
                                pro_tip: mergedContent.proTip,
                                script_example: mergedContent.scriptExample,
                                mini_quiz: mergedContent.miniQuiz,
                                practice_assignment: mergedContent.practiceAssignment
                            }} 
                            readOnly={selectedDay < currentCampaignDay} 
                        />
                    </div>
                )}

                {/* 5. Glossary */}
                {mergedContent.glossaryTerms.length > 0 && (
                    <div data-tour="campaign-glossary">
                        <CampaignGlossaryCard glossary={mergedContent.glossaryTerms} />
                    </div>
                )}

                {/* Gün Kapatma Yönlendirmesi */}
                <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100 shadow-sm text-center">
                    <p className="text-indigo-900 font-medium text-sm">
                        Bugünkü kamp odağını gün sonunda <span className="font-bold">Günü Mühürle</span> ekranında değerlendireceksin.
                    </p>
                </div>

                {/* 6. Daily Campaign Tasks */}
                <div className="pt-0 flex flex-col gap-2.5" data-tour="campaign-tasks">
                    <h2 className="text-lg font-black text-slate-900 mb-0.5 mt-1">Bugünün Kamp Görevleri</h2>
                    {isLoadingTasks ? (
                        <div className="py-8 text-center text-slate-500 font-medium">Görevler yükleniyor...</div>
                    ) : tasks && tasks.length > 0 ? (
                        <React.Fragment key={selectedDay}>
                            <CampaignTaskGroup 
                                title="Günün Dersi & Hazırlık" 
                                icon={BookOpen} 
                                tasks={eduTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                colorClass="bg-slate-100 text-slate-600" 
                                progressMap={taskProgressMap} 
                                pendingTaskId={completeTaskMutation.isPending && typeof completeTaskMutation.variables === 'string' ? completeTaskMutation.variables : selectedTaskForModal?.task?.id || null}
                            />
                            <CampaignTaskGroup 
                                title="Gelir Getirici Aktiviteler" 
                                icon={Target} 
                                tasks={gTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                colorClass="bg-blue-100 text-blue-600" 
                                progressMap={taskProgressMap} 
                                pendingTaskId={completeTaskMutation.isPending && typeof completeTaskMutation.variables === 'string' ? completeTaskMutation.variables : selectedTaskForModal?.task?.id || null}
                            />
                            <CampaignTaskGroup 
                                title="Portföy Üretimi" 
                                icon={Briefcase} 
                                tasks={pTasks} 
                                onComplete={handleCompleteTask} 
                                onSkip={handleSkipTask} 
                                colorClass="bg-purple-100 text-purple-600" 
                                progressMap={taskProgressMap} 
                                pendingTaskId={completeTaskMutation.isPending && typeof completeTaskMutation.variables === 'string' ? completeTaskMutation.variables : selectedTaskForModal?.task?.id || null}
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
                                pendingTaskId={completeTaskMutation.isPending && typeof completeTaskMutation.variables === 'string' ? completeTaskMutation.variables : selectedTaskForModal?.task?.id || null}
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
                                pendingTaskId={completeTaskMutation.isPending && typeof completeTaskMutation.variables === 'string' ? completeTaskMutation.variables : selectedTaskForModal?.task?.id || null}
                            />
                        </React.Fragment>
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
            
            {selectedTaskForModal && (
                <CampaignTaskCompletionModal 
                    task={selectedTaskForModal.task}
                    mode={selectedTaskForModal.mode}
                    isOpen={!!selectedTaskForModal}
                    onClose={() => setSelectedTaskForModal(null)}
                    onSubmit={handleModalSubmit}
                    isPending={isCompletingWithModal}
                />
            )}
            
            {user?.id && campaign?.id && (
                <Campaign90Tour userId={user.id} campaignId={campaign.id} />
            )}
        </div>
    );
};
