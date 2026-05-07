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
  }
};
