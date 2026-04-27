import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Map,
  Users,
  Briefcase,
  User as UserIcon,
  Plus,
  CheckSquare,
  CalendarDays,
  FileText,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import { Task, PersonalTask, UserProfile } from "../types";
import toast from "react-hot-toast";
import { getTodayStr } from "../services/core/utils";

interface TasksPageProps {
  profile: UserProfile | null;
  tasks: Task[];
  personalTasks: PersonalTask[];
  setShowAddTask: (show: boolean) => void;
}

type FlowItem = {
  id: string;
  source: "task" | "personal";
  title: string;
  notes?: string;
  typeLabel: string;
  sourceLabel: "İş" | "CRM" | "Portföy" | "Bölgem" | "Kişisel" | "İçerik";
  dueDate?: string;
  reminderTime?: string;
  priority?: "low" | "medium" | "high" | string;
  completed: boolean;
  raw: Task | PersonalTask;
};

type FlowTypeFilter =
  | "all"
  | "work"
  | "followup"
  | "portfolio"
  | "crm"
  | "bolgem"
  | "personal"
  | "content";

export const TasksPage: React.FC<TasksPageProps> = ({
  profile,
  tasks,
  personalTasks,
  setShowAddTask,
}) => {
  const queryClient = useQueryClient();
  const [flowFilter, setFlowFilter] = useState<
    "today" | "overdue" | "upcoming" | "all"
  >("today");
  const [typeFilter, setTypeFilter] = useState<FlowTypeFilter>("all");

  const allItems = useMemo(() => {
    const mappedTasks: FlowItem[] = tasks.map((t) => {
      let sourceLabel: FlowItem["sourceLabel"] = "İş";
      if (t.source === "bolgem") sourceLabel = "Bölgem";
      else if (t.source === "content" || t.type === "İçerik")
        sourceLabel = "İçerik";
      else if (t.source === "crm" || t.lead_id) sourceLabel = "CRM";
      else if (t.property_id) sourceLabel = "Portföy";

      return {
        id: t.id,
        source: "task",
        title: t.title,
        notes: t.notes,
        typeLabel: t.type || "İş Görevi",
        sourceLabel,
        dueDate: t.due_date,
        reminderTime: t.time,
        priority: "medium", // Default for tasks
        completed: t.completed,
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
      raw: t,
    }));

    return [...mappedTasks, ...mappedPersonal];
  }, [tasks, personalTasks]);

  const { filteredItems, stats } = useMemo(() => {
    const todayISO = getTodayStr();

    let todayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let personalIncompleteCount = 0;

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

    // Safe comparison mapping to valid dates
    const safeDateCompareStr = (item: FlowItem) => {
      const baseDate = parseTargetDate(item);

      if (item.reminderTime) {
        const parsedReminder = new Date(item.reminderTime);
        if (!isNaN(parsedReminder.getTime())) {
          const remDate = item.reminderTime.split("T")[0];
          // Only use reminder time for sorting if it matches the primary due date
          if (remDate === baseDate) {
            return item.reminderTime;
          } else {
            // Extract time from reminderTime and apply to baseDate? Or just use baseDate 09:00
            const timePart = item.reminderTime.split("T")[1] || "09:00:00.000Z";
            return `${baseDate}T${timePart}`;
          }
        }
      }
      return `${baseDate}T00:00:00`;
    };

    allItems.forEach((item) => {
      if (item.source === "personal" && !item.completed)
        personalIncompleteCount++;

      if (item.completed) return; // For top stats, only care about incomplete

      const targetDate = parseTargetDate(item);

      if (targetDate < todayISO) overdueCount++;
      else if (targetDate === todayISO) todayCount++;
      else upcomingCount++;
    });

    let displayItems = allItems.filter((item) => {
      // 1. apply flowFilter
      if (flowFilter !== "all") {
        if (item.completed) return false;

        const targetDate = parseTargetDate(item);

        if (flowFilter === "today" && targetDate !== todayISO) return false;
        if (flowFilter === "overdue" && targetDate >= todayISO) return false;
        if (flowFilter === "upcoming" && targetDate <= todayISO) return false;
      }

      // 2. apply typeFilter
      if (typeFilter !== "all") {
        if (typeFilter === "personal" && item.source !== "personal")
          return false;
        if (typeFilter === "content" && item.sourceLabel !== "İçerik")
          return false;
        if (typeFilter === "crm" && item.sourceLabel !== "CRM") return false;
        if (typeFilter === "portfolio" && item.sourceLabel !== "Portföy")
          return false;
        if (typeFilter === "bolgem" && item.sourceLabel !== "Bölgem")
          return false;
        if (typeFilter === "work" && item.sourceLabel !== "İş") return false;
        if (typeFilter === "followup") {
          const isFollowup =
            item.typeLabel === "Takip" ||
            item.title.toLowerCase().includes("takip") ||
            item.sourceLabel === "CRM" ||
            (item.raw as Task).metadata?.origin === "bolgem_network" ||
            (item.typeLabel === "Saha/Bölge" &&
              item.title.toLowerCase().includes("takip"));
          if (!isFollowup) return false;
        }
      }

      return true;
    });

    // Sub-sort display items
    displayItems.sort((a, b) => {
      if (flowFilter === "all") {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
      }

      const strA = safeDateCompareStr(a);
      const strB = safeDateCompareStr(b);

      return strA.localeCompare(strB);
    });

    return {
      filteredItems: displayItems,
      stats: {
        todayCount,
        overdueCount,
        upcomingCount,
        personalIncompleteCount,
      },
    };
  }, [allItems, flowFilter, typeFilter]);

  const handleToggle = async (item: FlowItem) => {
    try {
      const newStatus = !item.completed;
      if (item.source === "task") {
        await api.updateTaskStatus(item.id, newStatus);
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TASKS, profile?.id],
        });
      } else {
        await api.togglePersonalTask(item.id, newStatus);
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.id],
        });
      }
      toast.success(
        newStatus
          ? "Tamamlandı olarak işaretlendi!"
          : "Bekliyor durumuna alındı.",
      );
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu.");
    }
  };

  const sourceTypeLabels: { id: FlowTypeFilter; label: string }[] = [
    { id: "all", label: "Tümü" },
    { id: "work", label: "İş" },
    { id: "followup", label: "Takip" },
    { id: "portfolio", label: "Portföy" },
    { id: "crm", label: "CRM" },
    { id: "bolgem", label: "Bölgem" },
    { id: "content", label: "İçerik" },
    { id: "personal", label: "Kişisel" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CheckSquare className="text-orange-600" size={32} />
            Günlük Akış
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            İş görevlerin, takiplerin ve kişisel hatırlatıcıların tek yerde.
          </p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Plus size={20} />
          Görev / Hatırlatıcı Ekle
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setFlowFilter("today")}
          className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${
            flowFilter === "today"
              ? "bg-orange-50 border-orange-500 text-orange-900 shadow-lg shadow-orange-100"
              : "bg-white border-slate-100 hover:border-slate-300"
          }`}
        >
          <CalendarDays
            size={24}
            className={
              flowFilter === "today"
                ? "text-orange-500 mb-2"
                : "text-slate-400 mb-2"
            }
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Bugün
          </span>
          <span
            className={`text-2xl font-black ${flowFilter === "today" ? "text-orange-600" : "text-slate-900"}`}
          >
            {stats.todayCount}
          </span>
        </button>
        <button
          onClick={() => setFlowFilter("overdue")}
          className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${
            flowFilter === "overdue"
              ? "bg-red-50 border-red-500 text-red-900 shadow-lg shadow-red-100"
              : "bg-white border-slate-100 hover:border-slate-300"
          }`}
        >
          <AlertTriangle
            size={24}
            className={
              flowFilter === "overdue"
                ? "text-red-500 mb-2"
                : "text-slate-400 mb-2"
            }
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Geciken
          </span>
          <span
            className={`text-2xl font-black ${flowFilter === "overdue" ? "text-red-600" : "text-slate-900"}`}
          >
            {stats.overdueCount}
          </span>
        </button>
        <button
          onClick={() => setFlowFilter("upcoming")}
          className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${
            flowFilter === "upcoming"
              ? "bg-blue-50 border-blue-500 text-blue-900 shadow-lg shadow-blue-100"
              : "bg-white border-slate-100 hover:border-slate-300"
          }`}
        >
          <Clock
            size={24}
            className={
              flowFilter === "upcoming"
                ? "text-blue-500 mb-2"
                : "text-slate-400 mb-2"
            }
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Yaklaşan
          </span>
          <span
            className={`text-2xl font-black ${flowFilter === "upcoming" ? "text-blue-600" : "text-slate-900"}`}
          >
            {stats.upcomingCount}
          </span>
        </button>
        <button
          onClick={() =>
            setTypeFilter(typeFilter === "personal" ? "all" : "personal")
          }
          className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all ${
            typeFilter === "personal"
              ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-lg shadow-indigo-100"
              : "bg-white border-slate-100 hover:border-slate-300"
          }`}
        >
          <UserIcon
            size={24}
            className={
              typeFilter === "personal"
                ? "text-indigo-500 mb-2"
                : "text-slate-400 mb-2"
            }
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Kişisel
          </span>
          <span
            className={`text-2xl font-black ${typeFilter === "personal" ? "text-indigo-600" : "text-slate-900"}`}
          >
            {stats.personalIncompleteCount}
          </span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide mask-edges">
          {sourceTypeLabels.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                typeFilter === t.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFlowFilter(flowFilter === "all" ? "today" : "all")}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${flowFilter === "all" ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
        >
          {flowFilter === "all" ? "Sadece Bekleyenler" : "Tümünü Gör"}
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const isPersonal = item.source === "personal";
            const showCompleted = item.completed;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: showCompleted ? 0.6 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.id}
                className={`relative group bg-white p-4 rounded-2xl border-2 transition-all hover:shadow-md flex gap-4 ${
                  isPersonal
                    ? "border-indigo-100 hover:border-indigo-300"
                    : "border-slate-100 hover:border-slate-300"
                }`}
              >
                <div
                  className={`mt-1 cursor-pointer shrink-0 transition-transform active:scale-90 ${showCompleted ? "text-emerald-500" : "text-slate-300 hover:text-slate-400"}`}
                  onClick={() => handleToggle(item)}
                >
                  {showCompleted ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        isPersonal
                          ? "bg-indigo-50 text-indigo-700"
                          : item.sourceLabel === "İçerik"
                            ? "bg-fuchsia-50 text-fuchsia-700"
                            : item.sourceLabel === "CRM"
                              ? "bg-blue-50 text-blue-700"
                              : item.sourceLabel === "Bölgem"
                                ? "bg-yellow-50 text-yellow-700"
                                : item.sourceLabel === "Portföy"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.sourceLabel}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {item.typeLabel}
                    </span>
                    {item.priority === "high" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-50 text-red-700">
                        Yüksek
                      </span>
                    )}
                    {item.priority === "low" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">
                        Düşük
                      </span>
                    )}
                  </div>

                  <h3
                    className={`font-bold text-sm md:text-base leading-snug ${showCompleted ? "line-through text-slate-400" : "text-slate-900"}`}
                  >
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p
                      className={`mt-1 text-sm line-clamp-2 ${showCompleted ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {item.notes}
                    </p>
                  )}

                  {(item.reminderTime || item.dueDate) && (
                    <div
                      className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${showCompleted ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <Clock size={12} />
                      {item.reminderTime
                        ? new Date(item.reminderTime).toLocaleString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(item.dueDate!).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 px-6 flex flex-col items-center justify-center text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"
            >
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-400">
                {flowFilter === "overdue" ? (
                  <AlertTriangle size={24} />
                ) : (
                  <CheckSquare size={24} />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {flowFilter === "today"
                  ? "Bugün için kayıtlı akış yok."
                  : flowFilter === "overdue"
                    ? "Geciken iş yok. Harika!"
                    : flowFilter === "upcoming"
                      ? "Yaklaşan görev bulunmuyor."
                      : typeFilter === "personal"
                        ? "Kişisel hatırlatıcın yok."
                        : "Kayıt bulunamadı."}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Yeni bir görev veya hatırlatıcı ekleyerek operasyonlarını takip
                etmeye başlayabilirsin.
              </p>
              <button
                onClick={() => setShowAddTask(true)}
                className="mt-6 font-bold text-sm text-orange-600 bg-orange-50 px-6 py-2 rounded-xl hover:bg-orange-100 transition-colors"
              >
                Yeni Ekle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
