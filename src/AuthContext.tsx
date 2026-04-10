import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { addMonths, isAfter, parseISO } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  subscription_type: 'none' | '1-month' | '3-month' | '6-month' | '12-month';
  subscription_end_date: string | null;
  role: 'agent' | 'admin';
  has_seen_onboarding?: boolean;
  has_seen_tour?: boolean;
  notification_settings?: { push: boolean; email: boolean; time: string };
  region?: string;
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
  subscribe: (type: '1-month' | '3-month' | '6-month' | '12-month') => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeTour: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' && 
    !!import.meta.env.VITE_SUPABASE_URL
  );
  
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
        fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
      } else {
        setUser(null);
        setProfile(null);
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

  const fetchProfile = async (uid: string, email: string, displayName?: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      // Fallback profile so the app doesn't break if DB is not set up
      // Preserve optimistic state if it exists
      setProfile(prev => {
        if (prev) return prev;
        return {
          uid,
          email,
          display_name: displayName || 'İsimsiz Danışman',
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
      });
      setLoading(false);
      return;
    }

    if (data) {
      const localHasSeenOnboarding = localStorage.getItem(`has_seen_onboarding_${uid}`) === 'true';
      const localHasSeenTour = localStorage.getItem(`has_seen_tour_${uid}`) === 'true';
      const localSubType = localStorage.getItem(`subscription_type_${uid}`) as any || 'none';
      const localSubEnd = localStorage.getItem(`subscription_end_date_${uid}`);

      setProfile(prev => {
        // If we have optimistic state that is "further along" than the DB, keep it
        // This prevents the UI from flashing back to the start screen if DB is slow or failing
        if (prev) {
          return {
            ...data as UserProfile,
            has_seen_onboarding: prev.has_seen_onboarding || localHasSeenOnboarding || data.has_seen_onboarding,
            has_seen_tour: prev.has_seen_tour || localHasSeenTour || data.has_seen_tour,
            subscription_type: prev.subscription_type !== 'none' ? prev.subscription_type : (localSubType !== 'none' ? localSubType : data.subscription_type),
            subscription_end_date: prev.subscription_end_date || localSubEnd || data.subscription_end_date,
          };
        }
        return {
          ...data as UserProfile,
          has_seen_onboarding: localHasSeenOnboarding || data.has_seen_onboarding,
          has_seen_tour: localHasSeenTour || data.has_seen_tour,
          subscription_type: localSubType !== 'none' ? localSubType : data.subscription_type,
          subscription_end_date: localSubEnd || data.subscription_end_date,
        };
      });
    } else {
      // Create initial profile
      const newProfile: UserProfile = {
        uid,
        email,
        display_name: displayName || 'İsimsiz Danışman',
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
      
      // Filter out columns that might be missing in the DB
      const { subscription_type, subscription_end_date, has_seen_onboarding, has_seen_tour, ...dbProfile } = newProfile as any;
      const { error: insertError } = await supabase.from('profiles').insert(dbProfile);
      if (insertError) console.error('Error creating profile:', insertError);
      
      setProfile(prev => {
        if (prev) return prev; // Preserve optimistic state
        return newProfile;
      });
    }
    setLoading(false);
  };

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
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  const subscribe = async (type: 'trial' | '1-month' | '3-month' | '6-month' | '12-month') => {
    if (!user) return;
    
    let endDate: string;
    if (type === 'trial') {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      endDate = d.toISOString();
    } else {
      const months = parseInt(type.split('-')[0]);
      endDate = addMonths(new Date(), months).toISOString();
    }
    
    localStorage.setItem(`subscription_type_${user.id}`, type);
    localStorage.setItem(`subscription_end_date_${user.id}`, endDate);

    // Optimistic update to immediately let the user in (especially helpful if Supabase RLS policies aren't fully configured yet)
    setProfile(prev => {
      if (prev) {
        return { ...prev, subscription_type: type, subscription_end_date: endDate };
      }
      return {
        uid: user.id,
        email: user.email || '',
        display_name: user.user_metadata?.full_name || 'İsimsiz Danışman',
        subscription_type: type,
        subscription_end_date: endDate,
        role: 'agent',
        has_seen_onboarding: false,
        has_seen_tour: false,
        tier: 'free',
        total_xp: 0,
        broker_level: 1,
        current_streak: 0,
        streak_freeze_count: 0,
      };
    });

    const { error } = await supabase
      .from('profiles')
      .update({
        // subscription_type: type,
        // subscription_end_date: endDate,
      })
      .eq('uid', user.id);
    
    if (error) {
      console.error('Subscription error:', error);
      // In a real app, we might revert the optimistic update here if it fails
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    localStorage.setItem(`has_seen_onboarding_${user.id}`, 'true');
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, has_seen_onboarding: true } : null);
  };

  const completeTour = async () => {
    if (!user) return;
    
    localStorage.setItem(`has_seen_tour_${user.id}`, 'true');
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, has_seen_tour: true } : null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, ...data } : null);

    // Filter out columns that might be missing in the DB
    const { subscription_type, subscription_end_date, has_seen_onboarding, has_seen_tour, ...dbData } = data as any;

    const { error } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('uid', user.id);
      
    if (error) {
      console.error('Error updating profile:', error);
      fetchProfile(user.id, user.email || '');
    }
  };

  const isSubscribed = profile?.subscription_end_date 
    ? isAfter(parseISO(profile.subscription_end_date), new Date()) 
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
    <AuthContext.Provider value={{ user, profile, loading, isSubscribed, login, loginWithEmail, registerWithEmail, logout, subscribe, completeOnboarding, completeTour, updateProfileData }}>
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
