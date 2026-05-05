import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
  User as UserIcon,
  Plus,
  CheckSquare,
  CalendarDays,
  FileText,
  ChevronDown,
  Target,
  Video,
  Phone,
  Bell,
  ChevronRight,
  MapPin,
  Play,
  X,
  ArrowRight
} from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import { Task, PersonalTask, UserProfile, CampaignTask } from "../types";
import toast from "react-hot-toast";
import { getTodayStr } from "../services/core/utils";
import { AddTaskModal } from "../components/app/modals/AddTaskModal";
import { campaign90Service } from '../services/campaign90Service';
import { useNavigate } from 'react-router-dom';

const Campaign90RedirectBanner: React.FC<{userId: string, setActiveTab?: (t: string) => void}> = ({ userId, setActiveTab }) => {
  const { data: campaign } = useQuery({
    queryKey: ['campaign90_active', userId],
    queryFn: () => campaign90Service.getActiveCampaign(userId),
    enabled: !!userId,
  });

  const todayStr = getTodayStr();

  const { data: tasks } = useQuery({
      queryKey: ['campaign90_tasks', campaign?.id, todayStr],
      queryFn: () => campaign90Service.getTodayCampaignTasks(userId, todayStr),
      enabled: !!campaign?.id
  });

  const pendingCount = tasks?.filter(t => t.status !== 'completed' && t.status !== 'skipped').length || 0;

  if (!campaign) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-4 md:p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-lg overflow-hidden relative">
      <div className="absolute right-0 top-0 h-full w-48 bg-white/5 skew-x-[-20deg] translate-x-10" />
      <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
         <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Target size={24} className="text-[#00D2B4]" />
         </div>
         <div>
            <h3 className="font-black text-lg md:text-xl flex items-center gap-2">
              90 Gün Kampı
              {pendingCount > 0 && (
                <span className="bg-[#FF6B1A] text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{pendingCount} Görev</span>
              )}
            </h3>
            <p className="text-sm font-medium text-slate-300">Gün {campaign.current_day}/90 görevlerin seni bekliyor.</p>
         </div>
      </div>
      <button 
         onClick={() => setActiveTab?.('campaign-90')}
         className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors relative z-10 shrink-0"
      >
        Görevleri Aç <ChevronRight size={16} />
      </button>
    </div>
  );
};


const safeFormatTime = (isoString?: string | null) => {
  if (!isoString) return "Tam Gün";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "Tam Gün";
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
};

export interface TasksPageProps {
  profile: UserProfile | null;
  tasks: Task[];
  personalTasks: PersonalTask[];
  setShowAddTask: (show: boolean) => void;
  setActiveTab?: (tab: string) => void;
}

type FlowItem = {
  id: string;
  source: "task" | "personal" | "campaign";
  title: string;
  notes?: string;
  typeLabel: string;
  sourceLabel: "İş" | "CRM" | "Portföy" | "Bölgem" | "Kişisel" | "İçerik" | "Takip" | "Kampanya";
  dueDate?: string;
  reminderTime?: string;
  priority?: "low" | "medium" | "high" | string;
  completed: boolean;
  completedAt?: string;
  raw: Task | PersonalTask | CampaignTask;
};

// --- Minimal TaskDetailModal Component ---
const TaskDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: FlowItem | null;
}> = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Görev Detayı</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="mb-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Başlık</div>
              <div className="text-base font-medium text-slate-900">{item.title}</div>
            </div>
            
            {item.notes && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Açıklama / Notlar</div>
                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {item.notes}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kaynak</div>
                <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">{item.sourceLabel}</span>
                  <span className="text-xs text-slate-500">{item.typeLabel}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Durum</div>
                <div className="text-sm font-medium text-slate-700">
                  {item.completed ? (
                     <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={16}/> Tamamlandı</span>
                  ) : (
                     <span className="text-amber-600 flex items-center gap-1.5"><Clock size={16}/> Bekliyor</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Öncelik</div>
                  <div className="text-sm font-medium text-slate-700 capitalize">
                    {item.priority === 'high' ? 'Yüksek' : (item.priority === 'low' ? 'Düşük' : 'Orta')}
                  </div>
               </div>
               <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hedef Tarih</div>
                  <div className="text-sm font-medium text-slate-700">
                     {item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                     {item.reminderTime && ` - ${safeFormatTime(item.reminderTime)}`}
                  </div>
               </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
// --- End TaskDetailModal ---

type FlowTypeFilter =
  | "all"
  | "work"
  | "followup"
  | "portfolio"
  | "crm"
  | "bolgem"
  | "content"
  | "personal"
  | "campaign";

export const TasksPage: React.FC<TasksPageProps> = ({
  profile,
  tasks,
  personalTasks,
  setActiveTab
}) => {
  const queryClient = useQueryClient();
  const [flowFilter, setFlowFilter] = useState<"today" | "overdue" | "upcoming" | "all">("today");
  const [typeFilter, setTypeFilter] = useState<FlowTypeFilter>("all");
  const [visibleCount, setVisibleCount] = useState(8);

  const [showInternalAddTask, setShowInternalAddTask] = useState(false);
  const [internalAddTaskMode, setInternalAddTaskMode] = useState<"work"| "followup"| "personal"| "activity"| "content">("work");
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<FlowItem | null>(null);

  const { data: campaign } = useQuery({
    queryKey: ['campaign90_active', profile?.id],
    queryFn: () => campaign90Service.getActiveCampaign(profile!.id),
    enabled: !!profile?.id,
  });

  const todayStr = getTodayStr();

  const { data: campaignTasks } = useQuery({
      queryKey: ['campaign90_tasks', campaign?.id, todayStr],
      queryFn: () => campaign90Service.getTodayCampaignTasks(profile!.id, todayStr),
      enabled: !!campaign?.id && !!profile?.id
  });

  const isCampaignRestricted = campaign && campaign.current_day >= 8 && (!profile?.subscription_end_date || new Date(profile.subscription_end_date) < new Date()) && profile?.tier !== 'master' && profile?.tier !== 'pro' && profile?.tier !== 'elite';

  const handleFlowFilterChange = (val: "today" | "overdue" | "upcoming" | "all") => {
    setFlowFilter(val);
    setVisibleCount(8);
  };

  const handleTypeFilterChange = (val: FlowTypeFilter) => {
    setTypeFilter(val);
    setVisibleCount(8);
  };

  const { data: properties = [] } = useQuery({ queryKey: [QUERY_KEYS.PROPERTIES], queryFn: api.getProperties });
  const { data: leads = [] } = useQuery({ queryKey: [QUERY_KEYS.LEADS], queryFn: api.getLeads });

  const addTaskMutation = useMutation({
    mutationFn: api.addTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] }),
  });

  const addPersonalTaskMutation = useMutation({
    mutationFn: api.addPersonalTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS] }),
  });

  const allItems = useMemo(() => {
    const mappedTasks: FlowItem[] = tasks.map((t) => {
      let sourceLabel: FlowItem["sourceLabel"] = "İş";
      if (t.source === "bolgem") sourceLabel = "Bölgem";
      else if (t.source === "content" || t.type === "İçerik" || t.type === "Sosyal Medya")
        sourceLabel = "İçerik";
      else if (t.source === "crm" || t.lead_id) sourceLabel = "CRM";
      else if (t.property_id) sourceLabel = "Portföy";
      else if (t.title.toLowerCase().includes("takip") || t.type === "Takip") sourceLabel = "Takip";

      return {
        id: t.id,
        source: "task",
        title: t.title,
        notes: t.notes,
        typeLabel: t.type || "İş Görevi",
        sourceLabel,
        dueDate: t.due_date,
        reminderTime: t.time,
        priority: t.priority ?? "medium",
        completed: t.completed,
        completedAt: t.completed_at ?? undefined,
        raw: t,
      };
    });

    const mappedPersonal: FlowItem[] = personalTasks.map((t) => ({
      id: t.id,
      source: "personal",
      title: t.title,
      notes: t.notes,
      typeLabel: "Kişisel Hatırlatıcı",
      sourceLabel: "Kişisel",
      dueDate: t.due_date,
      reminderTime: t.reminder_time,
      priority: t.priority,
      completed: t.is_completed,
      completedAt: t.updated_at ?? undefined,
      raw: t,
    }));

    const mappedCampaign: FlowItem[] = (campaignTasks || []).filter(t => t.status !== 'skipped').map((t) => {
      const isLocked = isCampaignRestricted;
      return {
        id: t.id,
        source: "campaign",
        title: isLocked ? "Pro Özellik Kilidi Aç" : t.title,
        notes: isLocked ? "Paketi aktif et" : t.description,
        typeLabel: "90 Gün Kampı",
        sourceLabel: "Kampanya",
        dueDate: todayStr,
        priority: "high",
        completed: t.status === 'completed',
        completedAt: t.completed_at,
        raw: t,
      };
    });

    return [...mappedTasks, ...mappedPersonal, ...mappedCampaign];
  }, [tasks, personalTasks, campaignTasks, todayStr]);

  const { filteredItems, stats, overviews, flowNotes, focusBlock } = useMemo(() => {
    const todayISO = getTodayStr();

    let todayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let allCount = 0;

    let summaryCompleted = 0;
    let summaryPending = 0;
    let summaryOverdue = 0;

    const notesList: Array<{ text: string; time?: string; sourceLabel: string; isOverdue: boolean }> = [];

    let potentialFocus: FlowItem[] = [];

    const parseTargetDate = (item: FlowItem) => {
      let targetDateStr = item.dueDate;
      if (!targetDateStr && item.reminderTime) {
        targetDateStr = item.reminderTime.split("T")[0];
      }
      if (!targetDateStr) {
        targetDateStr = todayISO;
      }

      const parsed = new Date(targetDateStr);
      if (isNaN(parsed.getTime())) {
        return todayISO;
      }
      return targetDateStr.split("T")[0];
    };

    const safeDateCompareStr = (item: FlowItem) => {
      const baseDate = parseTargetDate(item);
      if (item.reminderTime) {
        const parsedReminder = new Date(item.reminderTime);
        if (!isNaN(parsedReminder.getTime())) {
          const remDate = item.reminderTime.split("T")[0];
          if (remDate === baseDate) return item.reminderTime;
          else return `${baseDate}T${item.reminderTime.split("T")[1] || "09:00:00.000Z"}`;
        }
      }
      return `${baseDate}T00:00:00`;
    };

    allItems.forEach((item) => {
      const targetDate = parseTargetDate(item);
      const isToday = targetDate === todayISO;
      const isOverdue = targetDate < todayISO && !item.completed;
      const isUpcoming = targetDate > todayISO && !item.completed;

      // Overview Stats
      if (item.completed) {
        // If completed today or no completion date fallback
        let isCompletedToday = false;
        if (item.completedAt) {
          isCompletedToday = item.completedAt.split("T")[0] === todayISO;
        } else {
          isCompletedToday = isToday;
        }
        if (isCompletedToday) summaryCompleted++;
      } else {
        if (isToday || isUpcoming) summaryPending++;
        if (isOverdue) summaryOverdue++;
      }

      if (item.completed) return; // Only incomplete items for filters & lists

      allCount++;
      if (isOverdue) overdueCount++;
      else if (isToday) todayCount++;
      else upcomingCount++;

      // Collect notes
      if (item.notes && item.notes.trim() && (isToday || isOverdue)) {
        notesList.push({
          text: item.notes,
          time: item.reminderTime,
          sourceLabel: item.sourceLabel,
          isOverdue
        });
      }

      // Collect candidates for focus block
      if (isToday || isOverdue) {
        potentialFocus.push(item);
      }
    });

    // Determine focus block
    potentialFocus.sort((a, b) => {
      // 1. High priority + Overdue
      const aScore = (a.priority === "high" ? 10 : 0) + (parseTargetDate(a) < todayISO ? 5 : 0);
      const bScore = (b.priority === "high" ? 10 : 0) + (parseTargetDate(b) < todayISO ? 5 : 0);
      if (aScore !== bScore) return bScore - aScore;
      
      // 2. Earliest Reminder
      const strA = safeDateCompareStr(a);
      const strB = safeDateCompareStr(b);
      return strA.localeCompare(strB);
    });

    let displayItems = allItems.filter((item) => {
      if (item.completed) return false;

      // 1. apply flowFilter
      if (flowFilter !== "all") {
        const targetDate = parseTargetDate(item);
        if (flowFilter === "today" && targetDate !== todayISO) return false;
        if (flowFilter === "overdue" && targetDate >= todayISO) return false;
        if (flowFilter === "upcoming" && targetDate <= todayISO) return false;
      }

      // 2. apply typeFilter
      if (typeFilter !== "all") {
        if (typeFilter === "personal" && item.source !== "personal") return false;
        if (typeFilter === "campaign" && item.source !== "campaign") return false;
        if (typeFilter === "content" && item.sourceLabel !== "İçerik") return false;
        if (typeFilter === "crm" && item.sourceLabel !== "CRM") return false;
        if (typeFilter === "portfolio" && item.sourceLabel !== "Portföy") return false;
        if (typeFilter === "bolgem" && item.sourceLabel !== "Bölgem") return false;
        if (typeFilter === "work" && item.sourceLabel !== "İş") return false;
        if (typeFilter === "followup" && item.sourceLabel !== "Takip" && item.typeLabel !== "Takip" && !item.title.toLowerCase().includes("takip")) return false;
      }

      return true;
    });

    displayItems.sort((a, b) => {
      const strA = safeDateCompareStr(a);
      const strB = safeDateCompareStr(b);
      return strA.localeCompare(strB);
    });

    // Notes
    notesList.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return 0;
    });

    return {
      filteredItems: displayItems,
      stats: {
        todayCount,
        overdueCount,
        upcomingCount,
        allCount,
      },
      overviews: {
        completed: summaryCompleted,
        pending: summaryPending,
        overdue: summaryOverdue
      },
      flowNotes: notesList.slice(0, 3), // Max 3 notes
      focusBlock: potentialFocus[0] || null
    };
  }, [allItems, flowFilter, typeFilter]);

  const handleToggle = async (e: React.MouseEvent, item: FlowItem) => {
    e.stopPropagation();
    try {
      const newStatus = !item.completed;
      if (item.source === "campaign" && setActiveTab) {
         setActiveTab('campaign-90');
         return;
      } else if (item.source === "task") {
        await api.updateTaskStatus(item.id, newStatus);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] });
      } else {
        await api.togglePersonalTask(item.id, newStatus);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.id] });
      }
      toast.success(newStatus ? "Tamamlandı olarak işaretlendi!" : "Bekliyor durumuna alındı.");
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu.");
    }
  };

  const handleRowClick = (item: FlowItem) => {
    if (item.source === "campaign" && setActiveTab) {
       setActiveTab('campaign-90');
       return;
    }
    setSelectedTaskDetails(item);
  };

  const openQuickAdd = (mode: "work"| "followup"| "personal"| "activity"| "content") => {
    setInternalAddTaskMode(mode);
    setShowInternalAddTask(true);
  };

  const getSourceStyle = (sourceLabel: string) => {
    switch(sourceLabel) {
      case "CRM": return { bg: "bg-emerald-50", text: "text-emerald-700", icon: <Phone size={14}/> };
      case "İş": return { bg: "bg-blue-50", text: "text-blue-700", icon: <Briefcase size={14}/> };
      case "Takip": return { bg: "bg-orange-50", text: "text-orange-700", icon: <CalendarDays size={14}/> };
      case "Portföy": return { bg: "bg-sky-50", text: "text-sky-700", icon: <FileText size={14}/> };
      case "Bölgem": return { bg: "bg-violet-50", text: "text-violet-700", icon: <MapPin size={14}/> };
      case "İçerik": return { bg: "bg-teal-50", text: "text-teal-700", icon: <Play size={14}/> };
      case "Kişisel": return { bg: "bg-rose-50", text: "text-rose-700", icon: <UserIcon size={14}/> };
      case "Kampanya": return { bg: "bg-[#00D2B4]/10", text: "text-[#00D2B4]", icon: <Target size={14}/> };
      default: return { bg: "bg-slate-100", text: "text-slate-600", icon: <CheckSquare size={14}/> };
    }
  };

  const getStatusBadge = (item: FlowItem) => {
    const todayISO = getTodayStr();
    let targetDateStr = item.dueDate || item.reminderTime?.split("T")[0] || todayISO;
    if (targetDateStr < todayISO) {
      return <span className="flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertTriangle size={14}/> Gecikti</span>;
    }
    if (item.priority === 'high') {
      return <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600"><Target size={14}/> Yüksek Öncelik</span>;
    }
    if (item.priority === 'medium') {
      return <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500"><Target size={14}/> Orta Öncelik</span>;
    }
    if (targetDateStr === todayISO) {
      return <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-600" /> Bugün</span>;
    }
    return <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><CalendarDays size={14}/> Planlandı</span>;
  };

  const totalOverview = overviews.completed + overviews.pending + overviews.overdue;
  const percCompleted = totalOverview ? (overviews.completed / totalOverview) * 100 : 0;
  const percPending = totalOverview ? (overviews.pending / totalOverview) * 100 : 0;
  const percOverdue = totalOverview ? (overviews.overdue / totalOverview) * 100 : 0;

  const displayList = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const renderOverviewCard = () => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-6">Bugünkü Özet</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
         <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900">{overviews.completed}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Tamamlanan</div>
         </div>
         <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Clock size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900">{overviews.pending}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Bekleyen</div>
         </div>
         <div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={18} />
            </div>
            <div className="text-2xl font-black text-slate-900">{overviews.overdue}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Geciken</div>
         </div>
      </div>
      
      <div className="mt-8 flex h-2 rounded-full overflow-hidden bg-slate-100">
         {totalOverview > 0 && <>
            {percCompleted > 0 && <div className="bg-emerald-500 h-full transition-all duration-500" style={{width: `${percCompleted}%`}} />}
            {percPending > 0 && <div className="bg-amber-400 h-full transition-all duration-500" style={{width: `${percPending}%`}} />}
            {percOverdue > 0 && <div className="bg-rose-500 h-full transition-all duration-500" style={{width: `${percOverdue}%`}} />}
         </>}
      </div>
      <p className="text-[11px] font-medium text-slate-400 mt-4 text-center">Toplam {totalOverview} görev</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-40 lg:pb-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Günlük Akış</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-0.5 md:mt-1">Bugün, gecikenler ve yaklaşan işler tek yerde.</p>
        </div>
        <button
          onClick={() => openQuickAdd('work')}
          className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-2xl font-bold shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all text-sm whitespace-nowrap"
        >
          <Plus size={18} /> Yeni Görev
        </button>
      </div>

      {profile?.id && <Campaign90RedirectBanner userId={profile.id} setActiveTab={setActiveTab} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Task List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Filters Row 1 (Flow) */}
          <div className="grid grid-cols-2 lg:flex bg-slate-100/60 p-1.5 rounded-2xl gap-1.5 lg:gap-0 lg:overflow-x-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden w-full">
            {(
              [ 
                { id: "today", label: "Bugün", count: stats.todayCount },
                { id: "overdue", label: "Gecikenler", count: stats.overdueCount },
                { id: "upcoming", label: "Yaklaşanlar", count: stats.upcomingCount },
                { id: "all", label: "Tümü", count: stats.allCount },
              ] as Array<{ id: "today" | "overdue" | "upcoming" | "all"; label: string; count: number }>
            ).map(f => (
              <button
                key={f.id}
                onClick={() => handleFlowFilterChange(f.id)}
                className={`flex items-center justify-center gap-2 px-3 md:px-6 py-2.5 rounded-xl font-bold text-[13px] md:text-sm transition-colors whitespace-nowrap flex-1 w-full lg:w-auto shrink-0 outline-none ${
                  flowFilter === f.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label} <span className={`px-2 py-0.5 rounded-md text-[10px] md:text-xs ${flowFilter === f.id ? "bg-slate-100 text-slate-600" : "bg-slate-200/50 text-slate-400"}`}>{f.count || 0}</span>
              </button>
            ))}
          </div>

          {/* Filters Row 2 (Type) */}
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mask-edges w-full">
            {(
              [
                { id: "all", label: "Tümü" },
                { id: "campaign", label: "Kampanya" },
                { id: "work", label: "İş" },
                { id: "followup", label: "Takip" },
                { id: "portfolio", label: "Portföy" },
                { id: "crm", label: "CRM" },
                { id: "bolgem", label: "Bölgem" },
                { id: "content", label: "İçerik" },
                { id: "personal", label: "Kişisel" },
              ] as Array<{ id: FlowTypeFilter; label: string }>
            ).map(t => (
              <button
                key={t.id}
                onClick={() => handleTypeFilterChange(t.id)}
                className={`px-5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all border shrink-0 outline-none ${
                  typeFilter === t.id
                    ? "bg-[#0f172a] text-white border-transparent shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile + Yeni Görev */}
          <button
            onClick={() => openQuickAdd('work')}
            className="md:hidden w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0f172a] text-white rounded-2xl font-bold shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all text-[15px] mb-2"
          >
          <Plus size={18} /> Yeni Görev
          </button>

          {/* Mobile Bugünkü Özet */}
          <div className="block lg:hidden w-full mb-4">
            {renderOverviewCard()}
          </div>

          {/* Task List */}
          <div className="flex flex-col gap-3">
            {displayList.map(item => {
              const srcStyle = getSourceStyle(item.sourceLabel);
              return (
                <div 
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="group bg-white p-4 rounded-3xl border border-slate-100 hover:border-[#0f172a]/20 hover:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] transition-all flex items-start sm:items-center gap-4 cursor-pointer"
                >
                  {item.source === 'campaign' ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setActiveTab) setActiveTab('campaign-90');
                      }}
                      className="shrink-0 mt-0.5 sm:mt-0"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#00D2B4]/10 text-[#00D2B4] hover:bg-[#00D2B4]/20 transition-colors cursor-pointer border border-[#00D2B4]/30 flex items-center gap-1">
                        Kampa Git <ArrowRight size={10} />
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={(e) => handleToggle(e, item)}
                      className="shrink-0 mt-0.5 sm:mt-0 text-slate-300 hover:text-emerald-500 transition-colors"
                    >
                      <div className="w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center border-current bg-white transition-all group-hover:border-emerald-500/50">
                        {item.completed && <CheckCircle2 size={16} className="text-emerald-500 fill-current bg-white rounded-full" />}
                      </div>
                    </div>
                  )}

                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${srcStyle.bg} ${srcStyle.text}`}>
                     {srcStyle.icon}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 pr-4">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.title}</h4>
                      {item.notes && <p className="text-xs text-slate-500 truncate mt-1">{item.notes}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0 mt-1 sm:mt-0">
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${srcStyle.bg} ${srcStyle.text}`}>
                        {item.sourceLabel}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-lg">
                         <Clock size={12} className="text-slate-400" />
                         {item.reminderTime 
                            ? safeFormatTime(item.reminderTime)
                            : (item.dueDate ? safeFormatTime(item.dueDate) : 'Tam Gün')
                         }
                      </div>
                      
                      <div className="flex justify-start sm:justify-end">
                        {getStatusBadge(item)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {filteredItems.length === 0 && (
              <div className="py-10 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-4">
                  <CheckSquare size={28} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 text-lg font-black mb-1 tracking-tight">Görev bulunamadı</h3>
                <p className="text-[13px] text-slate-500 max-w-[280px] mb-6 leading-relaxed">Bu filtreye uygun açık veya planlanmış bir görev bulunmuyor.</p>
                <button
                  onClick={() => openQuickAdd('work')}
                  className="px-6 py-3 bg-[#0f172a] text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm shadow-md hover:shadow-lg active:scale-[0.98] outline-none"
                >
                  Yeni Görev Ekle
                </button>
              </div>
            )}
          </div>

          {hasMore && (
            <button 
              onClick={() => setVisibleCount(v => v + 8)}
              className="mt-6 flex items-center justify-center gap-2 py-3.5 border-2 border-slate-100 rounded-2xl text-[13px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200 transition-all w-full max-w-sm mx-auto"
            >
              <Plus size={16} /> Daha fazla göster <ChevronDown size={16} />
            </button>
          )}

        </div>

        {/* Right Column - Widgets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Desktop Bugünkü Özet */}
          <div className="hidden lg:block">
             {renderOverviewCard()}
          </div>

          {/* Hızlı Ekle */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-5">Hızlı Ekle</h3>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => openQuickAdd('work')} className="flex items-center justify-center gap-2 border border-slate-100 bg-slate-50 px-3 py-4 rounded-2xl text-[12px] font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-100/50 hover:text-slate-800 transition-all group shadow-sm outline-none">
                 <Briefcase size={16} className="text-slate-400 group-hover:text-slate-600 group-hover:scale-110 transition-all" /> İş Görevi
               </button>
               <button onClick={() => openQuickAdd('followup')} className="flex items-center justify-center gap-2 border border-slate-100 bg-slate-50 px-3 py-4 rounded-2xl text-[12px] font-bold text-slate-600 hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-700 transition-all group shadow-sm outline-none">
                 <CalendarDays size={16} className="text-slate-400 group-hover:text-amber-500 group-hover:scale-110 transition-all" /> Takip
               </button>
               <button onClick={() => openQuickAdd('personal')} className="flex items-center justify-center gap-2 border border-slate-100 bg-slate-50 px-3 py-4 rounded-2xl text-[12px] font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-700 transition-all group shadow-sm outline-none">
                 <Bell size={16} className="text-slate-400 group-hover:text-rose-500 group-hover:scale-110 transition-all" /> Kişisel Hatırlatıcı
               </button>
               <button onClick={() => openQuickAdd('content')} className="flex items-center justify-center gap-2 border border-slate-100 bg-slate-50 px-3 py-4 rounded-2xl text-[12px] font-bold text-slate-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700 transition-all group shadow-sm outline-none">
                 <Video size={16} className="text-slate-400 group-hover:text-teal-500 group-hover:scale-110 transition-all" /> İçerik - Reels
               </button>
            </div>
          </div>

          {/* Akış Notları */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900">Akış Notları</h3>
            </div>
            
            {flowNotes.length > 0 ? (
              <div className="space-y-5">
                {flowNotes.map((note, idx) => {
                  return (
                    <div key={idx} className="flex gap-4 group">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-colors ${note.isOverdue ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-slate-800 group-hover:bg-slate-700'}`} />
                      <div className="min-w-0">
                         <p className="text-[13px] text-slate-700 leading-relaxed font-medium mb-1.5">
                           {note.text}
                         </p>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <span>{safeFormatTime(note.time)}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span>{note.sourceLabel}</span>
                         </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <FileText size={28} className="mx-auto text-slate-300 mb-3" />
                <p className="text-[13px] text-slate-600 font-bold mb-1">Akış notu yok</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed focus:outline-none">Görev veya hatırlatıcılara not eklendiğinde burada görünür.</p>
              </div>
            )}
          </div>

          {/* Odak Bloğu */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 lg:mb-0">
             
             <div className="flex items-center gap-2.5 mb-5">
               <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <Target size={18} />
               </div>
               <h3 className="font-bold text-slate-900 text-[15px]">Odak Bloğu</h3>
             </div>

             {focusBlock ? (
               <div 
                  onClick={() => handleRowClick(focusBlock)}
                  className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all cursor-pointer group relative"
               >
                 <h4 className="font-black text-slate-900 text-sm line-clamp-2 pr-6 mb-2 tracking-tight group-hover:text-indigo-900">{focusBlock.title}</h4>
                 <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{focusBlock.notes || 'Detay girilmedi.'}</p>
                 <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-[11px] font-bold text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors uppercase tracking-widest">
                    <Clock size={12} />
                    {focusBlock.reminderTime 
                      ? `${safeFormatTime(focusBlock.reminderTime)} tamamla` 
                      : 'Bugün içinde tamamla'}
                 </div>
                 <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-500 transition-colors group-hover:translate-x-1" />
               </div>
             ) : (
               <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 text-center">
                 <div className="w-12 h-12 bg-white rounded-full border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-3">
                   <CheckCircle2 size={24} className="text-emerald-400" />
                 </div>
                 <p className="text-[13px] font-bold text-slate-600">Tüm odağınız net!</p>
               </div>
             )}
          </div>

        </div>
      </div>

      <TaskDetailModal 
        isOpen={selectedTaskDetails !== null} 
        onClose={() => setSelectedTaskDetails(null)} 
        item={selectedTaskDetails} 
      />

      <AddTaskModal
        isOpen={showInternalAddTask}
        onClose={() => setShowInternalAddTask(false)}
        initialMode={internalAddTaskMode}
        onSubmit={async (data) => {
          try {
            await addTaskMutation.mutateAsync(data);
            toast.success('Görev eklendi');
            setShowInternalAddTask(false);
          } catch (error) {
            toast.error('Görev eklenirken bir hata oluştu');
            throw error;
          }
        }}
        onSubmitPersonal={async (data) => {
          try {
            await addPersonalTaskMutation.mutateAsync(data);
            toast.success("Kişisel hatırlatıcı eklendi");
            setShowInternalAddTask(false);
          } catch (error) {
            toast.error("Kişisel hatırlatıcı eklenemedi");
            throw error;
          }
        }}
        leads={leads}
        properties={properties}
      />
    </div>
  );
};
