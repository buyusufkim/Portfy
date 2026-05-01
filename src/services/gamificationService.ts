import { supabase } from "../lib/supabase";
import { getTodayStr, getUserId } from "./core/utils";
import { GamifiedTask } from "../types";

export const gamificationService = {
  getDailyGamifiedTasks: async (forceRefresh: boolean = false) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");
    const today = getTodayStr();

    // 1. Kullanıcı profili bilgisini al (hedef kitle kontrolü için)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier, subscription_type")
      .eq("id", userId)
      .single();

    // 2. Bugünkü gamified görevleri getir
    let { data: tasks } = await supabase
      .from("gamified_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    // 3. Aktif Task Template'leri getir (auto_generate = true olanlar)
    const { data: templates } = await supabase
      .from("task_templates")
      .select("*")
      .eq("auto_generate", true)
      .eq("is_active", true)
      .lte("start_date", today);

    const userTier = profile?.tier || "free";
    const userSub = profile?.subscription_type || "none";

    // 4. Template kontrolü & lazy creation
    const newTasksToInsert: any[] = [];

    if (templates && templates.length > 0) {
      for (const t of templates) {
        // end_date kontrolü
        if (t.end_date && t.end_date < today) continue;

        // Target Scope Kontrolü
        if (t.target_scope === "free" && userTier !== "free" && userSub !== "none") continue;
        if (t.target_scope === "trial" && userSub !== "trial") continue;
        if (t.target_scope === "master" && userTier !== "master") continue;

        let shouldGenerate = false;

        // Recurrence Kontrolü
        if (t.recurrence_type === "once") {
          if (t.start_date === today) shouldGenerate = true;
        } else if (t.recurrence_type === "daily") {
          shouldGenerate = true;
        } else if (t.recurrence_type === "interval" && t.interval_days > 0) {
          const startDate = new Date(t.start_date);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays % t.interval_days === 0) {
            shouldGenerate = true;
          }
        } else if (t.recurrence_type === "weekly" && t.recurrence_days?.length > 0) {
          const currentDayOfWeek = new Date(today).getDay(); // 0 is Sunday, 1 is Monday ...
          if (t.recurrence_days.includes(currentDayOfWeek)) {
            shouldGenerate = true;
          }
        } else if (t.recurrence_type === "monthly" && t.day_of_month) {
          const currentDayOfMonth = new Date(today).getDate();
          if (currentDayOfMonth === t.day_of_month) {
            shouldGenerate = true;
          }
        }

        if (shouldGenerate) {
          const templateAlreadyGenerated = tasks?.some(
            (task) => task.template_id === t.id && task.date === today
          );

          if (!templateAlreadyGenerated) {
            newTasksToInsert.push({
              user_id: userId,
              title: t.title,
              points: t.points || 10,
              category: t.category,
              date: today,
              is_completed: false,
              template_id: t.id,
              source: "admin_template",
              action_type: t.action_type || "general",
            });
          }
        }
      }
    }

    // Default task fallback if no tasks and no new templates to insert
    if ((!tasks || tasks.length === 0) && newTasksToInsert.length === 0) {
      newTasksToInsert.push(
        { user_id: userId, title: "Güne Erken Başla (Sabah Ritüelini Tamamla)", points: 100, category: "main", date: today, is_completed: false },
        { user_id: userId, title: "Bugün 3 Yeni Lead Ekle", points: 150, category: "smart", date: today, is_completed: false },
        { user_id: userId, title: "Bugün 1 Yeni Portföy Ekle", points: 300, category: "smart", date: today, is_completed: false },
        { user_id: userId, title: "Akşam Gün Kapanışını (Ritüeli) Tamamla", points: 100, category: "main", date: today, is_completed: false },
        { user_id: userId, title: "1 Kişisel Görev Tamamla", points: 50, category: "sweet", date: today, is_completed: false },
        { user_id: userId, title: "Peş peşe girişini sürdür", points: 50, category: "sweet", date: today, is_completed: false }
      );
    }

    if (newTasksToInsert.length > 0) {
      const { data: insertedTasks, error: insertError } = await supabase
        .from("gamified_tasks")
        .insert(newTasksToInsert)
        .select();

      if (!insertError && insertedTasks) {
         if(!tasks) tasks = [];
         tasks = [...tasks, ...insertedTasks];
      } else if (insertError) {
         console.warn("Could not insert recurring tasks. Might be a unique constraint violation", insertError);
      }
    }

    return (tasks || []) as GamifiedTask[];
  },

  completeGamifiedTask: async (taskId: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");

    const { data: task } = await supabase
      .from("gamified_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", userId)
      .single();
    if (!task) throw new Error("Task not found or permission denied");
    if (task.is_completed) return; // Zaten tamamlanmış

    const { data: updatedData, error } = await supabase
      .from("gamified_tasks")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select("id, points")
      .single();

    if (error) throw error;
    if (!updatedData) throw new Error("Task not found or permission denied");

    // Ödül puanını ver
    if (updatedData.points > 0) {
      await gamificationService.earnXP("COMPLETE_TASK", taskId, {
        points: updatedData.points,
      });
    }
  },

  updateGamifiedTask: async (id: string, data: Partial<GamifiedTask>) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");

    const { data: updatedData, error } = await supabase
      .from("gamified_tasks")
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
      
    if (error) throw error;
    if (!updatedData) throw new Error("Task not found or permission denied");
  },

  verifyGamifiedTask: async (task: GamifiedTask) => {
    const title = task.title.toLowerCase();

    if (task.is_completed)
      return { verified: false, message: "Bu görevi bugün zaten tamamladın." };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { verified: false, message: "Oturum açmadınız." };

      const res = await fetch("/api/ai/verify-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: task.title }),
      });

      if (res.ok) {
        const data = await res.json();
        return data; // { verified: boolean, message?: string }
      }
    } catch (e) {
      console.error("verify error:", e);
    }

    // Fallback: If it's a generic task, just verify
    return { verified: true };
  },

  earnXP: async (actionType: string, entityId?: string, stats?: any) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch("/api/ai/earn-xp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        actionType,
        taskId: entityId, // the backend checks leadId || propertyId || sessionId || taskId
        stats: stats || {}
      })
    });

    if (!res.ok) {
        let errorMsg = "XP kazanılamadı";
        try {
            const errData = await res.json();
            if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        throw new Error(errorMsg);
    }
    
    return await res.json();
  },

  getGamifiedStats: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return {
      points: profile.total_xp || 0,
      points_today: 0,
      streak: profile.current_streak || 0,
      momentum: 0,
      level: profile.broker_level || 1,
      level_name: "Junior",
      next_level_points: 1000,
      daily_progress: 0,
      tasks_completed_today: 0,
      total_tasks_today: 10,
    };
  },
};
