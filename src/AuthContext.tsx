import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { addMonths, isAfter, parseISO } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from './constants/queryKeys';
import { api } from './services/api';

interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  subscription_type: 'none' | 'trial' | '1-month' | '3-month' | '6-month' | '12-month';
  subscription_end_date: string | null;
  role: 'agent' | 'admin';
  has_seen_onboarding?: boolean;
  has_seen_tour?: boolean;
  notification_settings?: { push: boolean; email: boolean; time: string };
  region?: {
    city: string;
    district: string;
    neighborhoods: string[];
  };
  tier: 'free' | 'pro' | 'elite' | 'master' | 'none';
  total_xp: number;
  broker_level: number;
  current_streak: number;
  streak_freeze_count: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSubscribed: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  subscribe: (type: 'free' | 'trial' | '1-month' | '3-month' | '6-month' | '12-month') => Promise<boolean>;
  isSubscribing: boolean;
  completeOnboarding: () => Promise<void>;
  completeTour: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const queryClient = useQueryClient();
  const [isConfigured, setIsConfigured] = useState(
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' && 
    !!import.meta.env.VITE_SUPABASE_URL
  );

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: [QUERY_KEYS.PROFILE, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Profil yoksa tetikleyicinin çalışmış olmasını bekleriz veya hata fırlatırız
      if (!data) return null;
      
      return data as UserProfile;
    },
    enabled: !!user?.id,
    retry: 3, // Tetikleyicinin profili oluşturması için kısa bir süre tanırız
  });
  
  const isPopup = typeof window !== 'undefined' && (
    window.location.search.includes('popup=true') || 
    window.location.hash.includes('access_token=') ||
    window.name === 'oauth_popup'
  );

  useEffect(() => {
    if (isPopup) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else {
        queryClient.clear();
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isPopup]);

  const login = async () => {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/?popup=true`, skipBrowserRedirect: true }
    });
    if (data?.url) window.open(data.url, 'oauth_popup', 'width=600,height=700');
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const subscribe = async (type: 'free' | 'trial' | '1-month' | '3-month' | '6-month' | '12-month'): Promise<boolean> => {
    if (!user) return false;
    setIsSubscribing(true);
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('Oturum süresi dolmuş.');

      const response = await fetch('/api/ai/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ type })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Abonelik başarısız.');

      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
      return true;
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ has_seen_onboarding: true }).eq('uid', user.id);
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
  };

  const completeTour = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ has_seen_tour: true }).eq('uid', user.id);
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const response = await fetch('/api/ai/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ data })
    });
    if (response.ok) await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
  };

  const isSubscribed = profile?.subscription_end_date 
    ? isAfter(new Date(profile.subscription_end_date), new Date()) 
    : false;

  return (
    <AuthContext.Provider value={{ user, profile, loading: loading || profileLoading, isSubscribed, isSubscribing, login, loginWithEmail, registerWithEmail, logout, subscribe, completeOnboarding, completeTour, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};