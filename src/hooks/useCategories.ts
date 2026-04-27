import { Home, User, Store, Building2, MapIcon, MapPin, Briefcase, Key, Star, TrendingUp, AlertTriangle, MessageSquare, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { QUERY_KEYS } from '../constants/queryKeys';
import { RegionCategory, Category } from '../types';

export const DEFAULT_NETWORK_CATEGORIES: RegionCategory[] = [
  { id: 'esnaf', name: 'Esnaf', label: 'Esnaf', kind: 'network_contact', icon: Store, color: '#eab308', is_default: true },
  { id: 'bina_gorevlisi', name: 'Bina Görevlisi', label: 'Bina Görevlisi', kind: 'network_contact', icon: User, color: '#10b981', is_default: true },
  { id: 'site_yonetimi', name: 'Site Yönetimi', label: 'Site Yönetimi', kind: 'network_contact', icon: Building2, color: '#3b82f6', is_default: true },
  { id: 'guvenlik', name: 'Güvenlik', label: 'Güvenlik', kind: 'network_contact', icon: Key, color: '#64748b', is_default: true },
  { id: 'muhtar', name: 'Muhtar', label: 'Muhtar', kind: 'network_contact', icon: Target, color: '#a855f7', is_default: true },
  { id: 'mahalle_sakini', name: 'Mahalle Sakini', label: 'Mahalle Sakini', kind: 'network_contact', icon: User, color: '#8b5cf6', is_default: true },
  { id: 'yerel_isletme', name: 'Yerel İşletme', label: 'Yerel İşletme', kind: 'network_contact', icon: Briefcase, color: '#f59e0b', is_default: true },
  { id: 'potansiyel_satici', name: 'Potansiyel Satıcı', label: 'Potansiyel Satıcı', kind: 'network_contact', icon: TrendingUp, color: '#ef4444', is_default: true, auto_add_to_crm: true },
  { id: 'potansiyel_alici', name: 'Potansiyel Alıcı', label: 'Potansiyel Alıcı', kind: 'network_contact', icon: Target, color: '#0ea5e9', is_default: true, auto_add_to_crm: true },
  { id: 'potansiyel_kiraci', name: 'Potansiyel Kiracı', label: 'Potansiyel Kiracı', kind: 'network_contact', icon: User, color: '#14b8a6', is_default: true, auto_add_to_crm: true },
];

export const DEFAULT_REGION_CATEGORIES: RegionCategory[] = [
  { id: 'firsat_noktasi', name: 'Fırsat Noktası', label: 'Fırsat Noktası', kind: 'region_point', icon: Star, color: '#eab308', is_default: true },
  { id: 'rakip_ofis', name: 'Rakip Ofis', label: 'Rakip Ofis', kind: 'region_point', icon: Building2, color: '#ef4444', is_default: true },
  { id: 'bos_daire_ihtimali', name: 'Boş Daire İhtimali', label: 'Boş Daire İhtimali', kind: 'region_point', icon: Home, color: '#10b981', is_default: true },
  { id: 'yeni_insaat', name: 'Yeni İnşaat', label: 'Yeni İnşaat', kind: 'region_point', icon: Target, color: '#f97316', is_default: true },
  { id: 'degerlenen_cadde', name: 'Değerlenen Cadde', label: 'Değerlenen Cadde', kind: 'region_point', icon: TrendingUp, color: '#8b5cf6', is_default: true },
  { id: 'hizli_kiralanan_sokak', name: 'Hızlı Kiralanan Sokak', label: 'Hızlı Kiralanan Sokak', kind: 'region_point', icon: MapPin, color: '#3b82f6', is_default: true },
  { id: 'sorunlu_bina', name: 'Sorunlu Bina', label: 'Sorunlu Bina', kind: 'region_point', icon: AlertTriangle, color: '#64748b', is_default: true },
  { id: 'bolge_notu', name: 'Bölge Notu', label: 'Bölge Notu', kind: 'region_point', icon: MessageSquare, color: '#94a3b8', is_default: true },
];

// Fallbacks for CRM compat
export const DEFAULT_CATEGORIES = [
  ...DEFAULT_NETWORK_CATEGORIES.map(c => ({ id: c.id, label: c.name, icon: c.icon as React.ElementType, color: c.color! })),
  ...DEFAULT_REGION_CATEGORIES.map(c => ({ id: c.id, label: c.name, icon: c.icon as React.ElementType, color: c.color! }))
];

export const useCategories = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: customCategories = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', profile.id);
      
      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        id: c.id,
        name: c.label || c.name || c.id,
        label: c.label || c.name || c.id,
        kind: c.kind || 'network_contact',
        icon: MapIcon
      })) as RegionCategory[];
    },
    enabled: !!profile?.id
  });

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, color, kind = 'network_contact', auto_add_to_crm = false }: { name: string, color: string, kind?: string, auto_add_to_crm?: boolean }) => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: profile.id,
          label: name,
          color: color,
          icon: 'MapIcon',
          kind,
          is_default: false,
          auto_add_to_crm
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORIES, profile?.id] });
    }
  });

  const allRegionCategories: RegionCategory[] = [
    ...DEFAULT_NETWORK_CATEGORIES,
    ...DEFAULT_REGION_CATEGORIES,
    ...customCategories
  ];
  
  // This helps to be backwards compatible with anything just requesting "categories"
  const allCategories: Category[] = allRegionCategories.map(c => ({
    id: c.id,
    label: c.label || c.name,
    color: c.color,
    icon: (c.icon as React.ElementType) || MapIcon
  }));

  return {
    categories: allCategories, // mapped for compat
    regionCategories: allRegionCategories, // full region category config
    customCategories,
    addCategory: (name: string, color: string, kind: string = 'network_contact', auto_add_to_crm: boolean = false) => addCategoryMutation.mutate({ name, color, kind, auto_add_to_crm }),
    loading
  };
};
