import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEffectiveAiTokenLimit } from '../config/subscriptionLimits';

export const useTokenUsage = () => {
  const [usageData, setUsageData] = useState({ current: 0, limit: 100, percentage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        const limit = getEffectiveAiTokenLimit(data); 
        const currentUsage = data.ai_tokens_used || 0;
        const MathLimit = Math.max(limit, 1);
        const percentage = (currentUsage / MathLimit) * 100;

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