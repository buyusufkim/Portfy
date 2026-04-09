import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateRevenueStats } from '../lib/revenueUtils';
import { RevenueStats } from '../types/revenue';
import { useAuth } from '../AuthContext';

export const useRevenueStats = () => {
  const { profile } = useAuth();
  
  return useQuery<RevenueStats>({
    queryKey: ['revenueStats', profile?.uid],
    queryFn: async () => {
      const [leads, properties, missedOpportunities] = await Promise.all([
        api.getLeads(),
        api.getProperties(),
        api.getMissedOpportunities(),
      ]);

      return calculateRevenueStats(leads, properties, missedOpportunities);
    },
    enabled: !!profile?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
