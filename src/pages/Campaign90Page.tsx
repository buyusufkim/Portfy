import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { campaign90Service } from '../services/campaign90Service';
import { Card } from '../components/UI';
import { Trophy, CheckCircle2, Play, Activity, Check, Circle, X, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTodayStr } from '../services/core/utils';
import { CampaignTask, UserProfile } from '../types';

export const Campaign90Page: React.FC = () => {
    const queryClient = useQueryClient();
    const [isStarting, setIsStarting] = useState(false);
    
    // For form
    const [region, setRegion] = useState('');
    const [niche, setNiche] = useState('');
    
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

    useEffect(() => {
        if (profile) {
            if (!region) {
                const reg = profile.region?.district || profile.district;
                if (reg) setRegion(reg);
            }
            if (!niche) {
                const exp = profile.expertise_areas?.filter(Boolean).join(', ');
                if (exp) setNiche(exp);
            }
        }
    }, [profile]);

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

    const { data: progress } = useQuery({
        queryKey: ['campaign90_progress', campaign?.id],
        queryFn: () => campaign90Service.getCampaignProgress(campaign!.id),
        enabled: !!campaign?.id
    });

    const startMutation = useMutation({
        mutationFn: async () => {
            // Also update profile if they changed it
            if (profile?.id && region && region !== profile.district && region !== profile.region?.district) {
                await supabase.from('profiles').update({ district: region }).eq('id', profile.id);
            }
            return campaign90Service.startCampaign({ region, niche });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign90_active'] });
            toast.success("Kamp başarıyla başlatıldı!");
        },
        onError: (err: any) => {
            console.error("Start campaign error:", err);
            const msg = err.message || "Kamp başlatılırken bir hata oluştu.";
            if (msg.includes('PGRST205')) {
                toast.error("90 Gün Kampı tabloları veritabanında yok. Lütfen Supabase'de migration uygulayın.", { duration: 5000 });
            } else {
                toast.error(msg);
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
        onError: (err: any) => {
            console.error("Complete task error:", err);
            toast.error(err.message || "Görev tamamlanırken bir hata oluştu.");
        }
    });

    const skipTaskMutation = useMutation({
        mutationFn: async (taskId: string) => campaign90Service.skipCampaignTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaign90_tasks'] });
            queryClient.invalidateQueries({ queryKey: ['campaign90_progress'] });
            toast.success("Görev atlandı.");
        },
        onError: (err: any) => {
            console.error("Skip task error:", err);
            toast.error(err.message || "Görev atlanırken bir hata oluştu.");
        }
    });

    if (isLoadingCampaign) {
        return <div className="p-8 flex justify-center text-slate-500">Yükleniyor...</div>;
    }

    if (!campaign) {
        return (
            <div className="max-w-xl mx-auto p-4 md:p-8 pb-32">
                <Card className="p-6 md:p-10 bg-gradient-to-br from-[#061A32] to-[#041A33] text-white rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                       <Trophy size={200} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <Trophy size={32} className="text-[#00D2B4]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4">Portfy 90 Günlük Danışman Kampı</h1>
                        <p className="text-xl font-bold text-[#FF6B1A] mb-4">"İlk 90 gün, önümüzdeki 10 yılın temelini atar."</p>
                        <p className="text-slate-300 mb-8 leading-relaxed">
                            Portfy sana sadece boş bir CRM vermez. Her gün ne yapacağını söyleyen,
                            yaptığını ölçen ve seni gerçek bir gayrimenkul profesyoneline dönüştüren dijital bir mentor sistemi sunar.
                        </p>

                        {!isStarting ? (
                            <button 
                                onClick={() => setIsStarting(true)}
                                className="w-full bg-[#00D2B4] hover:bg-[#00e3c5] text-[#061A32] font-black text-lg py-4 rounded-xl transition-colors shadow-lg shadow-[#00D2B4]/20 flex items-center justify-center gap-2"
                            >
                                Kampa Başla <Play size={20} className="fill-current" />
                            </button>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Uzmanlık Bölgen</label>
                                    <div className="relative">
                                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                      <input 
                                        type="text" 
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        placeholder="Örn: Talas, Mevlana" 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2B4]"
                                      />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Uzmanlık Alanın</label>
                                    <div className="relative">
                                      <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                      <input 
                                        type="text" 
                                        value={niche}
                                        onChange={(e) => setNiche(e.target.value)}
                                        placeholder="Örn: Satılık Daire, Kiralık Daire, Arsa, Ticari" 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2B4]"
                                      />
                                    </div>
                                </div>
                                <div className="pt-4 pb-2">
                                    <button 
                                        onClick={() => startMutation.mutate()}
                                        disabled={startMutation.isPending || !region || !niche}
                                        className="w-full bg-[#FF6B1A] hover:bg-[#ff803d] text-white font-black text-lg py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 relative z-50 mb-12 lg:mb-0"
                                    >
                                        {startMutation.isPending ? 'Başlatılıyor...' : 'Hedefi Onayla ve Başla!'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    const completedPercent = progress?.total ? Math.round((progress.completed / progress.total) * 100) : 0;

    // AI Coach Insight mock based on rules
    let coachMessage = "Bugün sistem çalıştı. Yarın aynı disiplini tekrar et.";
    if (progress) {
        if (progress.g < 2 && progress.a >= 2) coachMessage = "Bilgi topluyorsun ama insanla konuşmuyorsun. Gelir getirici aktivite olmadan portföy gelmez.";
        else if (progress.p < 1 && progress.g >= 2) coachMessage = "Temas var ama portföy üretimi zayıf. Değer analizi ve yetki görüşmesine odaklan.";
        else if (progress.a < 1 && progress.g >= 2) coachMessage = "Saha yapıyorsun ama bölge uzmanlığı eksik. Bölgeni bilmeden güven veremezsin.";
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row gap-6">
                <Card className="p-6 bg-[#061A32] text-white flex-1 rounded-3xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              <Trophy size={20} className="text-[#00D2B4]" />
                           </div>
                           <div>
                               <h2 className="font-bold">Hafta {campaign.current_week}/13</h2>
                               <p className="text-xs text-slate-400">Gün {campaign.current_day}/90 Devam Ediyor</p>
                           </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span>Haftalık Tamamlanma</span>
                                <span>{completedPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00D2B4] rounded-full transition-all duration-1000" style={{ width: `${completedPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white flex-1 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" /> 
                        GPA Kümülatif Skor
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="w-full h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                                <span className="font-black text-blue-600 text-xl">{progress?.g || 0}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">G: Aktivite</div>
                        </div>
                        <div className="text-center">
                            <div className="w-full h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
                                <span className="font-black text-purple-600 text-xl">{progress?.p || 0}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">P: Portföy</div>
                        </div>
                        <div className="text-center">
                            <div className="w-full h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
                                <span className="font-black text-orange-600 text-xl">{progress?.a || 0}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">A: Uzmanlık</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                        <span className="text-xs font-medium text-slate-500">Toplam Skor: </span>
                        <span className="font-black text-slate-800 text-lg">{progress?.gpaScore || 0} Puan</span>
                    </div>
                </Card>
            </div>

            <Card className="p-4 bg-orange-50 border-orange-100 text-orange-800 rounded-2xl flex gap-3 items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                   <Play size={18} className="fill-orange-500 text-orange-500" />
                </div>
                <div>
                   <h4 className="text-sm font-bold mb-0.5">Saha Koçu İçgörüsü</h4>
                   <p className="text-xs font-medium opacity-80">{coachMessage}</p>
                </div>
            </Card>

            {/* Tasks Area */}
            <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">Haftanın Kamp Görevleri</h3>
                <div className="space-y-3">
                    {isLoadingTasks ? (
                        <div className="py-8 text-center text-slate-500">Görevler yükleniyor...</div>
                    ) : tasks && tasks.length > 0 ? (
                        tasks.map((task: CampaignTask) => (
                            <Card key={task.id} className={`p-4 border ${task.status === 'completed' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'} rounded-2xl shadow-sm transition-all`}>
                                <div className="flex gap-4 items-start">
                                    <button 
                                        onClick={() => task.status !== 'completed' && completeTaskMutation.mutate(task.id)}
                                        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                            task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-500'
                                        }`}
                                    >
                                        <Check size={14} strokeWidth={3} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                task.gpa_bucket === 'G' ? 'bg-blue-100 text-blue-700' :
                                                task.gpa_bucket === 'P' ? 'bg-purple-100 text-purple-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {task.gpa_bucket}
                                            </span>
                                            <h4 className={`text-sm font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                {task.title}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{task.description}</p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                            +{task.xp_reward} XP
                                        </div>
                                        {task.status !== 'completed' && task.status !== 'skipped' && (
                                            <button 
                                                onClick={() => skipTaskMutation.mutate(task.id)}
                                                className="text-[10px] text-slate-400 hover:text-red-500 font-medium flex items-center gap-1"
                                            >
                                                <X size={12} /> Atla
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">Şu an gösterilecek görev yok.</div>
                    )}
                </div>
            </div>

        </div>
    );
};
