import { Home, User, Store, Building2, MapIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { QUERY_KEYS } from '../constants/queryKeys';

export const DEFAULT_CATEGORIES = [
  { id: 'mulk_sahibi', label: 'Mülk Sahibi', icon: Home, color: '#f97316' },
  { id: 'kiraci', label: 'Kiracı', icon: User, color: '#3b82f6' },
  { id: 'gorevli', label: 'Görevli', icon: User, color: '#10b981' },
  { id: 'esnaf', label: 'Esnaf', icon: Store, color: '#eab308' },
  { id: 'insaat', label: 'İnşaat', icon: Building2, color: '#64748b' },
];

export const useCategories = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: customCategories = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES, profile?.uid],
    queryFn: async () => {
      if (!profile?.uid) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('agent_id', profile.uid);
      
      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        icon: MapIcon
      }));
    },
    enabled: !!profile?.uid
  });

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string, color: string }) => {
      if (!profile?.uid) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('categories')
        .insert({
          agent_id: profile.uid,
          label: name,
          color: color,
          icon: 'MapIcon'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES, profile?.uid] });
    }
  });

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  return {
    categories: allCategories,
    customCategories,
    addCategory: (name: string, color: string) => addCategoryMutation.mutate({ name, color }),
    loading
  };
};
