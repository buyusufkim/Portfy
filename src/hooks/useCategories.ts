import { Filter, Store, User, Building2, Home, Star, MapIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export const DEFAULT_CATEGORIES = [
  { id: 'mulk_sahibi', label: 'Mülk Sahibi', icon: Home, color: '#f97316' },
  { id: 'kiraci', label: 'Kiracı', icon: User, color: '#3b82f6' },
  { id: 'gorevli', label: 'Görevli', icon: User, color: '#10b981' },
  { id: 'esnaf', label: 'Esnaf', icon: Store, color: '#eab308' },
  { id: 'insaat', label: 'İnşaat', icon: Building2, color: '#64748b' },
];

export const useCategories = () => {
  const [customCategories, setCustomCategories] = useState<any[]>(() => {
    const saved = localStorage.getItem('customCategories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  const addCategory = (name: string, color: string) => {
    if (!name.trim()) return;
    const newCategory = {
      id: `custom_${Date.now()}`,
      label: name,
      icon: MapIcon, // Default icon for custom categories
      color: color
    };
    setCustomCategories([...customCategories, newCategory]);
  };

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  return {
    categories: allCategories,
    customCategories,
    addCategory
  };
};
