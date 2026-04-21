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
        .from('profiles')
        .select('ai_tokens_used, tier')
        .eq('id', user.id)
        .single();

      if (data) {
        // Frontend'de sabit limitler (Pro için 10.000)
        const limit = data.tier === 'pro' ? 10000 : 1000; 
        const currentUsage = data.ai_tokens_used || 0;
        const percentage = (currentUsage / limit) * 100;

        setUsageData({
          current: currentUsage,
          limit: limit,
          percentage: Math.min(percentage, 100)
        });
      }
      setLoading(false);
    };

    fetchUsage();
  }, []);

  return { ...usageData, loading };
};