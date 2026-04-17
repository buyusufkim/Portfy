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
  tier: 'free' | 'pro' | 'elite' | 'master';
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
  subscribe: (type: 'trial' | '1-month' | '3-month' | '6-month' | '12-month') => Promise<void>;
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
      
      if (!data) {
        // Create initial profile if it doesn't exist
        const newProfile = {
          uid: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || 'İsimsiz Danışman',
          subscription_type: 'none',
          subscription_end_date: null,
          role: 'agent',
          has_seen_onboarding: false,
          has_seen_tour: false,
          tier: 'free',
          total_xp: 0,
          broker_level: 1,
          current_streak: 0,
          streak_freeze_count: 0,
        };
        const { error: insertError } = await supabase.from('profiles').insert(newProfile);
        if (insertError) console.error('Error creating profile:', insertError);
        return newProfile as UserProfile;
      }
      
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });
  
  // Synchronous detection to prevent first-frame app render in popup
  const isPopup = typeof window !== 'undefined' && (
    window.location.search.includes('popup=true') || 
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('error=') ||
    window.name === 'oauth_popup' ||
    (!!window.opener && window.opener !== window)
  );

  if (isPopup) {
    console.log('AuthContext: Popup mode detected', {
      search: window.location.search,
      hash: !!window.location.hash,
      name: window.name,
      hasOpener: !!window.opener
    });
  }

  useEffect(() => {
    if (isPopup) {
      const handlePopupAuth = (session: any) => {
        console.log('AuthContext: handlePopupAuth called', !!session);
        if (session) {
          try {
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                session: {
                  access_token: session.access_token,
                  refresh_token: session.refresh_token
                }
              }, '*');
            }
          } catch (e) {
            console.error('PostMessage error:', e);
          }
          // Fallback communication for main window
          localStorage.setItem('oauth_success', Date.now().toString());
          
          console.log('AuthContext: Closing popup in 500ms');
          // Small delay to ensure message/storage is sent before closing
          setTimeout(() => {
            window.close();
          }, 500);
        }
      };

      const { data: { subscription: popupSub } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || session) {
          handlePopupAuth(session);
        }
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) handlePopupAuth(session);
      });
      
      return () => popupSub.unsubscribe();
    }

    // --- MAIN WINDOW LOGIC ---
    // Listen for auth changes - this will handle initial session and subsequent changes.
    // We avoid calling getSession() here because it can race with onAuthStateChange 
    // and cause "lock stolen" errors in Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: onAuthStateChange', event, !!session);
      
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else {
        // Clear all session data on logout (manual or automatic)
        console.log('AuthContext: Clearing session data and cache');
        queryClient.clear();
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for popup success message
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log('AuthContext: Received OAUTH_AUTH_SUCCESS', !!event.data.session);
        if (event.data.session) {
          await supabase.auth.setSession({
            access_token: event.data.session.access_token,
            refresh_token: event.data.session.refresh_token
          });
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // Listen for localStorage fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'oauth_success') {
        console.log('AuthContext: Received oauth_success from storage');
        // No need to call getSession, onAuthStateChange will pick it up
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isPopup]);

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/?popup=true`,
        skipBrowserRedirect: true,
      }
    });

    if (error) {
      console.error('Login error:', error);
      return;
    }

    if (data?.url) {
      const authWindow = window.open(
        data.url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Lütfen bu site için açılır pencerelere (pop-up) izin verin.');
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        }
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    // Clear React Query cache to prevent data leaking between sessions
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  const subscribe = async (type: 'trial' | '1-month' | '3-month' | '6-month' | '12-month') => {
    if (!user) return;
    setIsSubscribing(true);
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        console.log(`[AuthContext] Initiating subscription request for ${type}`);
        const response = await fetch('/api/ai/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ type }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        if (!response.ok) {
          console.error(`[AuthContext] Subscription API Error:`, result);
          throw new Error(result.error || result.details || 'Abonelik işlemi başarısız oldu.');
        }

        console.log(`[AuthContext] Subscription SUCCESS`);
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error(`[AuthContext] Subscription TIMEOUT after 30s`);
          throw new Error('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
        }
        console.error(`[AuthContext] Subscription Fetch Error:`, err);
        throw err;
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Abonelik işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      refetchProfile();
    } finally {
      setIsSubscribing(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ has_seen_onboarding: true })
      .eq('uid', user.id);

    if (error) {
      console.error('Onboarding update error:', error);
    }
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
  };

  const completeTour = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ has_seen_tour: true })
      .eq('uid', user.id);

    if (error) {
      console.error('Tour update error:', error);
    }
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    // List of fields that are safe for users to update themselves
    const SAFE_FIELDS = [
      'display_name',
      'phone',
      'avatar_url',
      'avatar_color',
      'bio',
      'city',
      'district',
      'has_seen_onboarding',
      'has_seen_tour',
      'notification_settings'
    ];

    // Filter out any protected fields before sending to server
    const filteredData: any = {};
    Object.keys(data).forEach(key => {
      if (SAFE_FIELDS.includes(key)) {
        filteredData[key] = (data as any)[key];
      }
    });

    if (Object.keys(filteredData).length === 0) return;

    try {
      const response = await fetch('/api/ai/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ data: filteredData })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Profile update failed');
      }
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, user.id] });
    } catch (error) {
      console.error('Error updating profile:', error);
      refetchProfile();
    }
  };

  const isSubscribed = profile?.subscription_end_date 
    ? isAfter(new Date(profile.subscription_end_date), new Date()) 
    : false;

  if (isPopup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-xs w-full space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="text-orange-600" size={40} />
            </div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-orange-600 border-t-transparent rounded-3xl animate-spin mx-auto" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Giriş Yapılıyor</h2>
              <p className="text-slate-500 text-sm">Lütfen bekleyin, ana uygulamaya yönlendiriliyorsunuz...</p>
            </div>
            <button 
              onClick={() => window.close()}
              className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
            >
              Pencere kapanmazsa buraya tıklayın
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto">
            <Sparkles className="text-red-600" size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Supabase Bağlantı Hatası</h2>
            <p className="text-slate-500 text-sm">
              Uygulamanın çalışabilmesi için Supabase bağlantısının yapılması gerekiyor. Lütfen <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">.env</code> dosyanızdaki veya sunucu ayarlarınızdaki <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">VITE_SUPABASE_URL</code> ve <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">VITE_SUPABASE_ANON_KEY</code> değişkenlerini kontrol edin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading: loading || profileLoading, isSubscribed, isSubscribing, login, loginWithEmail, registerWithEmail, logout, subscribe, completeOnboarding, completeTour, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
