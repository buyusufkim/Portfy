import { supabase } from '../lib/supabase';

export interface AdminUserActivitySummary {
  accountAgeDays: number;
  daysSinceLastActive: number;
  propertiesCount: number;
  leadsCount: number;
  aiRequestsCount: number;
  aiTokensUsed: number;
  packageRequestsCount: number;
  supportTicketsCount: number;
  campaignCurrentDay: number;
  campaignProgressPercent: number;
  usageScore: number;
  churnRiskLevel: 'healthy' | 'watch' | 'risk' | 'critical';
  churnRiskReasons: string[];
}

export interface AdminUserTimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  created_at: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
  metadata?: any;
}

export interface AdminUserActivityResponse {
  user: {
    id: string;
    display_name: string;
    email: string;
    phone: string;
    tier: string;
    subscription_type: string;
    subscription_end_date: string;
    created_at: string;
    last_active_date: string;
  };
  summary: AdminUserActivitySummary;
  timeline: AdminUserTimelineEvent[];
}

export const adminUserActivityService = {
  async getAdminUserActivity(userId: string): Promise<AdminUserActivityResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum bulunamadı");

    const res = await fetch(`/api/admin/users/${userId}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Aktivite verisi alınamadı");
    }
    
    return res.json();
  }
};
