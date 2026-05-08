import { supabase } from '../lib/supabase';

export interface AdminCampaignOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  abandonedOrInactiveCampaigns: number;
  startedTodayCount: number;
  closedTodayCount: number;
  tasksCompletedTodayCount: number;
  averageProgressPercent: number;
  averageCurrentDay: number;
  riskUserCount: number;
  reflectionsTodayCount: number;
  missingReflectionsTodayCount: number;
  staleReflectionsCount: number;
}

export interface AdminCampaignUser {
  campaign_id: string;
  user_id: string;
  display_name: string;
  email: string;
  phone: string;
  region: string;
  campaign_status: 'active' | 'paused' | 'completed' | 'cancelled';
  start_date: string;
  current_day: number;
  progress_percent: number;
  overall_completion_percent: number;
  completed_tasks_count: number;
  total_tasks_count: number;
  today_tasks_total: number;
  today_tasks_completed: number;
  last_activity_at: string;
  today_started: boolean;
  today_closed: boolean;
  risk_level: 'healthy' | 'watch' | 'risk' | 'critical';
  risk_reasons: string[];
  tier?: string;
  lastAnswerAt: string | null;
  lastAnswerDayNumber: number | null;
  totalAnsweredDays: number;
  answeredToday: boolean;
  missingTodayAnswer: boolean;
  daysSinceLastAnswer: number;
  reflectionStatus: "answered_today" | "missing_today" | "stale" | "none";
  openFollowupCount: number;
  latestFollowupAt: string | null;
  latestFollowupType: string | null;
  latestFollowupPriority: string | null;
}

export interface AdminCampaignDayContentOverview {
  day_number: number;
  title: string;
  short_summary: string | null;
  learning_content: string | null;
  mentor_message: string | null;
  vocabulary_title: string | null;
  vocabulary_content: string | null;
  task_brief: string | null;
  daily_questions: string[] | null;
  video_title: string | null;
  video_url: string | null;
  video_duration_minutes: number | null;
  status: 'draft' | 'published' | 'inactive';
  week_number?: number | null;
  phase_title?: string | null;
  main_objective?: string | null;
  module_title?: string | null;
  learning_goals?: string[] | null;
  field_example?: string | null;
  common_mistake?: string | null;
  pro_tip?: string | null;
  script_example?: string | null;
  mini_quiz?: any[] | null;
  practice_assignment?: string | null;
  glossary_terms?: any[] | null;
  homework?: any | null;
  task_items?: any[] | null;
  video_placeholder?: string | null;
  updated_at?: string;
}

export interface AdminCampaignDayContent extends AdminCampaignDayContentOverview {}

export interface AdminCampaignUserDetail extends AdminCampaignUser {
  scores: {
    score_date: string;
    completed_tasks: number;
    total_tasks: number;
    completed_optional_tasks: number;
    total_optional_tasks: number;
  }[];
  answers?: {
    day_number: number;
    answered_at: string;
    answers: any;
  }[];
}

export const adminCampaign90Service = {
  async getAdminCampaignOverview(): Promise<AdminCampaignOverview> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch('/api/admin/campaign90/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("İstatistikler alınamadı");
    return res.json();
  },

  async getAdminCampaignUsers(params: { statusFilter?: string, dayRange?: string }): Promise<AdminCampaignUser[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const query = new URLSearchParams();
    if (params.statusFilter) query.append('statusFilter', params.statusFilter);
    if (params.dayRange) query.append('dayRange', params.dayRange);

    const res = await fetch(`/api/admin/campaign90/users?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Kullanıcılar alınamadı");
    const json = await res.json();
    return json.data || [];
  },

  async getAdminCampaignUserDetail(userId: string): Promise<AdminCampaignUserDetail | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/users/${userId}/detail`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Kullanıcı detayı alınamadı");
    const json = await res.json();
    return json.data || null;
  },

  async getAdminCampaignDayContents(): Promise<AdminCampaignDayContentOverview[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch('/api/admin/campaign90/day-contents', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Gün içerikleri alınamadı");
    const json = await res.json();
    return json.data || [];
  },

  async getAdminCampaignDayContentByNumber(dayNumber: number): Promise<AdminCampaignDayContent | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/day-contents/${dayNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("İçerik alınamadı");
    const json = await res.json();
    return json.data || null;
  },

  async updateAdminCampaignDayContent(dayNumber: number, payload: Partial<AdminCampaignDayContent>): Promise<AdminCampaignDayContent> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/day-contents/${dayNumber}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error("İçerik güncellenemedi");
    const json = await res.json();
    return json.data;
  },

  async seedCampaign90DefaultDayContents(mode: 'missing_only' | 'fill_empty'): Promise<{ insertedCount: number, updatedCount: number, skippedCount: number, totalDays: number, missingDays: number }> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/day-contents-seed`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode })
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Seed işlemi başarısız oldu");
    }
    const json = await res.json();
    return json;
  },

  getAdminCampaignUserFollowups: async (userId: string): Promise<any[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/users/${userId}/followups`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Takip notları alınamadı");
    const json = await res.json();
    return json.data || [];
  },

  createCampaign90UserFollowup: async (userId: string, payload: any): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/users/${userId}/followups`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || "Not eklenemedi");
    }
    return res.json();
  },

  updateCampaign90Followup: async (followupId: string, payload: any): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/followups/${followupId}`, {
        method: 'PATCH',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || "Güncellenemedi");
    }
    return res.json();
  },

  generateMentorInsight: async (userId: string): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum yok");

    const res = await fetch(`/api/admin/campaign90/users/${userId}/mentor-insight`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        throw new Error(d.error || "Yorum oluşturulamadı");
    }
    const json = await res.json();
    return json.data;
  }
};
