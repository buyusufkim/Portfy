import { supabase } from "../lib/supabase";
import { getTodayStr, getUserId } from "./core/utils";
import { GamifiedTask } from "../types";

export type GamifiedTaskInsert = {
  user_id: string;
  title: string;
  points: number;
  category: string;
  date: string;
  is_completed: boolean;
  template_id?: string;
  source?: string;
  action_type?: string;
  auto_verify?: boolean;
};

export const gamificationService = {
  getDailyGamifiedTasks: async (forceRefresh: boolean = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch("/api/ai/gamified-tasks/daily", {
       headers: {
         Authorization: `Bearer ${session.access_token}`,
       }
    });

    if (!res.ok) {
        throw new Error("Failed to load daily tasks");
    }

    const data = await res.json();
    return (data.tasks || []) as GamifiedTask[];
  },

  completeGamifiedTask: async (taskId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch("/api/ai/complete-gamified-task", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ taskId }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to complete task");
    }

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || "Failed to complete task");
    }
  },

  updateGamifiedTask: async (id: string, data: Pick<GamifiedTask, "ai_reason" | "reminder_time" | "notified">) => {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");

    const allowedData: Pick<GamifiedTask, "ai_reason" | "reminder_time" | "notified"> = {};
    if (data.ai_reason !== undefined) allowedData.ai_reason = data.ai_reason;
    if (data.reminder_time !== undefined) allowedData.reminder_time = data.reminder_time;
    if (data.notified !== undefined) allowedData.notified = data.notified;

    const { data: updatedData, error } = await supabase
      .from("gamified_tasks")
      .update(allowedData)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();
      
    if (error) throw error;
    if (!updatedData) throw new Error("Task not found or permission denied");
  },

  verifyGamifiedTask: async (task: GamifiedTask) => {
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
        body: JSON.stringify({ taskId: task.id }),
      });

      if (res.ok) {
        const data = await res.json();
        return data; // { verified: boolean, message?: string }
      }
    } catch (e) {
      console.error("verify error:", e);
    }

    return { verified: false, message: "Bağlantı hatası veya sunucu yanıt vermedi." };
  },

  earnXP: async (actionType: string, entityId?: string, stats?: Record<string, string | number | boolean | null | undefined>) => {
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
