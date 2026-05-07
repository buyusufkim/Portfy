import { supabase } from '../lib/supabase';

export interface AdminOperationsOverview {
  totalUsers: number;
  totalProperties: number;
  activeProperties: number;
  passiveProperties: number;
  totalLeads: number;
  hotLeads: number;
  silentLeads: number;
  usersWithNoProperties: number;
  usersWithNoLeads: number;
  usersWithNoCrmActivity: number;
  propertiesMissingPhotos: number;
  propertiesMissingPrice: number;
  propertiesMissingLocation: number;
  marketingOutputsCount: number;
  mapPinsCount: number;
  fieldVisitsCount: number;
  topCities: any[];
  riskUsersCount: number;
}

export interface AdminOperationsUser {
  user_id: string;
  display_name: string;
  email: string;
  phone: string;
  tier: string;
  city?: string;
  district?: string;
  properties_count: number;
  active_properties_count: number;
  leads_count: number;
  hot_leads_count: number;
  silent_leads_count: number;
  marketing_outputs_count: number;
  map_pins_count: number;
  field_visits_count: number;
  last_property_at: string | null;
  last_lead_at: string | null;
  last_activity_at: string | null;
  usage_score: number;
  risk_level: 'healthy' | 'watch' | 'risk' | 'critical';
  risk_reasons: string[];
}

export const adminOperationsService = {
  async getAdminOperationsOverview(): Promise<AdminOperationsOverview> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum bulunamadı");

    const res = await fetch('/api/admin/operations/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Operasyon istatistikleri alınamadı");
    return res.json();
  },

  async getAdminOperationsUsers(params: { segment?: string }): Promise<AdminOperationsUser[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum bulunamadı");

    const query = new URLSearchParams();
    if (params.segment) query.append('segment', params.segment);

    const res = await fetch(`/api/admin/operations/users?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Kullanıcı operasyon listesi alınamadı");
    const json = await res.json();
    return json.data || [];
  }
};
