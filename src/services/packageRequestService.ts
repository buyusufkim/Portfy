import { supabase } from '../lib/supabase';
import { PackageRequest } from '../types';

export const packageRequestService = {
  async getActivePackages() {
    const { data, error } = await supabase
      .from('subscription_packages')
      .select('*')
      .eq('is_active', true)
      .order('price_numeric', { ascending: true });
      
    if (error) {
      console.error("Failed to fetch packages", error);
      return [];
    }
    return data || [];
  },

  async createActivationRequest(input: { user_note?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingPending, error: checkError } = await supabase
      .from('package_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('request_type', 'activation')
      .eq('status', 'pending')
      .limit(1);

    if (checkError) throw checkError;

    if (existingPending && existingPending.length > 0) {
      // Don't throw, just return the existing one so we don't break the flow
      return existingPending[0];
    }

    const { data, error } = await supabase
      .from('package_requests')
      .insert([{
        user_id: user.id,
        request_type: 'activation',
        requested_package: 'activation',
        requested_duration: '1-month', // default fallback
        amount_numeric: 0,
        amount_text: 'Aktivasyon Talebi',
        user_note: input.user_note,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createPackageRequest(input: {
    requested_duration: string;
    user_note?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const packages = await this.getActivePackages();
    const pkg = packages.find(p => p.id === input.requested_duration || p.duration_months + '-month' === input.requested_duration);

    if (!pkg) {
      throw new Error('Seçilen paket şu an aktif değil. Lütfen tekrar deneyin.');
    }
    
    // Check for existing pending package_upgrade requests
    const { data: existingPending, error: checkError } = await supabase
      .from('package_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('request_type', 'package_upgrade')
      .eq('status', 'pending')
      .limit(1);
      
    if (checkError) throw checkError;
    
    if (existingPending && existingPending.length > 0) {
      throw new Error('Zaten bekleyen bir paket talebiniz bulunmaktadır.');
    }

    const { data, error } = await supabase
      .from('package_requests')
      .insert([{
        user_id: user.id,
        request_type: 'package_upgrade',
        requested_package: pkg.tier || 'master',
        requested_duration: pkg.id,
        amount_numeric: pkg.price_numeric,
        amount_text: pkg.price_text,
        user_note: input.user_note
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMyPackageRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('package_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PackageRequest[];
  },

  async cancelMyRequest(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('package_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) throw error;
  },

  async adminGetPackageRequests() {
    // Requires admin privilege
    // First fetch all package requests to avoid FK issues if local DB differs from prod DB
    const { data: requests, error } = await supabase
      .from('package_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table missing in prod yet, return empty but let ui handle gracefully
      if (error.code === 'PGRST116' || error.message.includes('relation "public.package_requests" does not exist')) {
        throw new Error('MISSING_TABLE');
      }
      throw error;
    }
    
    if (!requests || requests.length === 0) return [];
    
    // Extract unique user_ids
    const userIds = Array.from(new Set(requests.map(r => r.user_id).filter(Boolean)));
    
    // Fetch profiles individually
    let profilesData: any[] = [];
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email, phone, tier, subscription_type, subscription_end_date')
        .in('id', userIds);
        
      if (!profilesError && profiles) {
        profilesData = profiles;
      }
    }
    
    const profileMap = new Map(profilesData.map(p => [p.id, p]));

    // Map 'profiles' back to 'user' for PackageRequest matching
    return requests.map(req => ({
      ...req,
      user: profileMap.get(req.user_id) || null
    })) as PackageRequest[];
  },

  async adminApprovePackageRequest(id: string, adminNote?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // To perform the approval, we could use the /api/ai/admin endpoint to update user, or just rely on RLS
    // If the RLS on profiles allows admins to update it: Let's assume it does, but we must update both
    // Actually, AdminPanel currently uses `/api/ai/admin/update-user`
    
    // So here we only update `package_requests` to approved, but wait, updating `profiles` is also required.
    // Let's do it right here with Supabase JS. The admin role RLS in profiles allows updating other profiles if admin.
    const { data: req, error: reqError } = await supabase
      .from('package_requests')
      .select('*')
      .eq('id', id)
      .single();
      
    if (reqError) throw reqError;
    if (req.status !== 'pending') throw new Error('Yalnızca bekleyen talepler onaylanabilir.');

    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token;
    
    if (!token) throw new Error("Admin session not found");

    let updateData: any = {};

    if (req.request_type === 'activation') {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 7);
      
      updateData = {
        tier: 'trial',
        subscription_type: 'trial',
        subscription_end_date: newEndDate.toISOString()
      };
    } else {
      const monthsMap: Record<string, number> = {
        '1-month': 1,
        '3-month': 3,
        '6-month': 6,
        '12-month': 12
      };
      
      if (!monthsMap[req.requested_duration]) {
        throw new Error('Geçersiz paket süresi. Talep onaylanamadı.');
      }
      
      const months = monthsMap[req.requested_duration];
      
      // Read current user
      const { data: targetUser, error: uError } = await supabase
        .from('profiles')
        .select('subscription_end_date')
        .eq('id', req.user_id)
        .single();
        
      if (uError) throw uError;

      let baseDate = new Date();
      if (targetUser.subscription_end_date && new Date(targetUser.subscription_end_date) > baseDate) {
        baseDate = new Date(targetUser.subscription_end_date);
      }
      
      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      updateData = {
        tier: 'master',
        subscription_type: req.requested_duration,
        subscription_end_date: newEndDate.toISOString()
      };
    }
    
    const response = await fetch('/api/ai/admin/update-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: req.user_id, data: updateData })
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error('User profile update failed: ' + (body.error || response.statusText));
    }

    // Update package_requests
    const { error: updateError } = await supabase
      .from('package_requests')
      .update({
        status: 'approved',
        admin_note: adminNote || null,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;
  },

  async adminRejectPackageRequest(id: string, adminNote?: string) {
    const { error: updateError } = await supabase
      .from('package_requests')
      .update({
        status: 'rejected',
        admin_note: adminNote || null,
        rejected_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending');

    if (updateError) throw updateError;
  }
};
