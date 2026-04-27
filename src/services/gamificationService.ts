import { supabase } from "../lib/supabase";
import { getTodayStr, getUserId } from "./core/utils";
import { GamifiedTask } from "../types";

export const gamificationService = {
  getDailyGamifiedTasks: async (forceRefresh: boolean = false) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");
    const today = getTodayStr();

    // Görevleri getir
    let { data: tasks } = await supabase
      .from("gamified_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    // Eğer bugün hiç görev yoksa varsayılan görevleri oluştur
    if (!tasks || tasks.length === 0) {
      const defaultTasks = [
        {
          user_id: userId,
          title: "Güne Erken Başla (Sabah Ritüelini Tamamla)",
          points: 100,
          category: "main",
          date: today,
          is_completed: false,
        },
        {
          user_id: userId,
          title: "Bugün 3 Yeni Lead Ekle",
          points: 150,
          category: "smart",
          date: today,
          is_completed: false,
        },
        {
          user_id: userId,
          title: "Bugün 1 Yeni Portföy Ekle",
          points: 300,
          category: "smart",
          date: today,
          is_completed: false,
        },
        {
          user_id: userId,
          title: "Akşam Gün Kapanışını (Ritüeli) Tamamla",
          points: 100,
          category: "main",
          date: today,
          is_completed: false,
        },
        {
          user_id: userId,
          title: "1 Kişisel Görev Tamamla",
          points: 50,
          category: "sweet",
          date: today,
          is_completed: false,
        },
        {
          user_id: userId,
          title: "Peş peşe girişini sürdür",
          points: 50,
          category: "sweet",
          date: today,
          is_completed: false,
        },
      ];

      const { data: newTasks, error: insertError } = await supabase
        .from("gamified_tasks")
        .insert(defaultTasks)
        .select();
      if (insertError) {
        console.error("Default gamified tasks insert error:", insertError);
        throw insertError;
      }
      if (newTasks) {
        tasks = newTasks;
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
    const todayStr = getTodayStr();
    const userId = await getUserId();

    if (task.is_completed)
      return { verified: false, message: "Bu görevi bugün zaten tamamladın." };

    try {
      if (title.includes("peş peşe girişini sürdür")) {
        return { verified: true };
      }

      if (title.includes("müşteri") || title.includes("lead")) {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", `${todayStr}T00:00:00`);

        const match = title.match(/(\d+)/);
        const target = match ? parseInt(match[1]) : 1;

        if ((count || 0) >= target) return { verified: true };
        return {
          verified: false,
          message: `Bugün ${count || 0}/${target} müşteri ekledin. ${target - (count || 0)} kişi daha eklemelisin!`,
        };
      }

      if (title.includes("portföy")) {
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", `${todayStr}T00:00:00`);

        const match = title.match(/(\d+)/);
        const target = match ? parseInt(match[1]) : 1;

        if ((count || 0) >= target) return { verified: true };
        return {
          verified: false,
          message: `Bugün ${count || 0}/${target} portföy ekledin. ${target - (count || 0)} portföy daha eklemelisin!`,
        };
      }

      if (title.includes("görev")) {
        const { count } = await supabase
          .from("personal_tasks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_completed", true)
          .gte("updated_at", `${todayStr}T00:00:00`);

        const match = title.match(/(\d+)/);
        // "1 kişisel görev" - check for numbers
        const target = match ? parseInt(match[1]) : 1;

        if ((count || 0) >= target) return { verified: true };
        return {
          verified: false,
          message: `Bugün ${count || 0}/${target} kişisel görev tamamladın!`,
        };
      }

      if (title.includes("sabah ritüeli") || title.includes("erken başla")) {
        const profile = await supabase
          .from("profiles")
          .select("morning_ritual_completed")
          .eq("id", userId)
          .single();
        if (profile.data?.morning_ritual_completed) return { verified: true };
        return {
          verified: false,
          message: "Sabah ritüelini henüz tamamlamadın.",
        };
      }

      if (title.includes("akşam ritüeli") || title.includes("kapanış")) {
        const profile = await supabase
          .from("profiles")
          .select("evening_ritual_completed")
          .eq("id", userId)
          .single();
        if (profile.data?.evening_ritual_completed) return { verified: true };
        return { verified: false, message: "Gün kapanışını henüz yapmadın." };
      }
    } catch (e) {
      console.error("verify error:", e);
    }

    // Fallback: If it's a generic task, just verify
    return { verified: true };
  },

  earnXP: async (actionType: string, entityId?: string, stats?: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("award_xp", {
      p_user_id: user.id,
      p_action_type: actionType,
      p_entity_id: entityId || null,
      p_today: getTodayStr(),
      p_now: new Date().toISOString(),
      p_stats: stats || {},
    });

    if (error) throw error;
    return data;
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
