import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTokenUsage = () => {
  const [usageData, setUsageData] = useState({ current: 0, limit: 100, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_usage_limits')
        .select('current_month_usage, monthly_token_limit')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const percentage = (data.current_month_usage / data.monthly_token_limit) * 100;
        setUsageData({
          current: data.current_month_usage,
          limit: data.monthly_token_limit,
          percentage: Math.min(percentage, 100) // Yüzde 100'ü geçmesini engelliyoruz
        });
      }
      setLoading(false);
    };

    fetchUsage();
  }, []);

  return { ...usageData, loading };
};