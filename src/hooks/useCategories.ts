import { Filter, Store, User, Building2, Home, Star, MapIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const DEFAULT_CATEGORIES = [
  { id: 'mulk_sahibi', label: 'Mülk Sahibi', icon: Home, color: '#f97316' },
  { id: 'kiraci', label: 'Kiracı', icon: User, color: '#3b82f6' },
  { id: 'gorevli', label: 'Görevli', icon: User, color: '#10b981' },
  { id: 'esnaf', label: 'Esnaf', icon: Store, color: '#eab308' },
  { id: 'insaat', label: 'İnşaat', icon: Building2, color: '#64748b' },
];

export const useCategories = () => {
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('agent_id', user.id);
    
    if (error) {
      console.error('Error fetching categories:', error);
    } else if (data) {
      setCustomCategories(data.map(c => ({
        ...c,
        icon: MapIcon // Default icon for custom categories
      })));
    }
    setLoading(false);
  };

  const addCategory = async (name: string, color: string) => {
    if (!name.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newCategory = {
      agent_id: user.id,
      label: name,
      color: color,
      icon: 'MapIcon'
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(newCategory)
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
    } else if (data) {
      setCustomCategories([...customCategories, { ...data, icon: MapIcon }]);
    }
  };

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  return {
    categories: allCategories,
    customCategories,
    addCategory,
    loading
  };
};
