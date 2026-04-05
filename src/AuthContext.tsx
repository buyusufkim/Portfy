import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { addMonths, isAfter, parseISO } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  subscriptionType: 'none' | '1-month' | '3-month' | '6-month' | '12-month';
  subscriptionEndDate: string | null;
  role: 'agent' | 'admin';
  hasSeenOnboarding?: boolean;
  hasSeenTour?: boolean;
  notificationTime?: string;
  region?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSubscribed: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  subscribe: (type: '1-month' | '3-month' | '6-month' | '12-month') => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeTour: () => Promise<void>;
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(prevUser => {
        if (session?.user) {
          if (!prevUser || prevUser.id !== session.user.id) {
            fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
            return session.user;
          }
          return prevUser;
        } else {
          setLoading(false);
          return null;
        }
      });
    }).catch(err => {
      console.error("Supabase connection error:", err);
      // If it's a fetch error, it might be because Supabase is not configured
      setIsConfigured(false);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(prevUser => {
        if (session?.user) {
          if (!prevUser || prevUser.id !== session.user.id) {
            fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
            return session.user;
          }
          return prevUser;
        } else {
          if (prevUser !== null) {
            setProfile(null);
            setLoading(false);
          }
          return null;
        }
      });
    });

    // Listen for popup success message
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log('AuthContext: Received OAUTH_AUTH_SUCCESS', !!event.data.session);
        if (event.data.session) {
          const { data, error } = await supabase.auth.setSession({
            access_token: event.data.session.access_token,
            refresh_token: event.data.session.refresh_token
          });
          if (data.session) {
            setUser(prevUser => {
              if (!prevUser || prevUser.id !== data.session!.user.id) {
                fetchProfile(data.session!.user.id, data.session!.user.email || '', data.session!.user.user_metadata?.full_name);
                return data.session!.user;
              }
              return prevUser;
            });
            return;
          }
        }
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setUser(prevUser => {
              if (!prevUser || prevUser.id !== session.user.id) {
                fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
                return session.user;
              }
              return prevUser;
            });
          } else {
            // Force reload if session is still null after success message
            window.location.reload();
          }
        });
      }
    };
    window.addEventListener('message', handleMessage);

    // Listen for localStorage fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'oauth_success') {
        console.log('AuthContext: Received oauth_success from storage');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setUser(prevUser => {
              if (!prevUser || prevUser.id !== session.user.id) {
                fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
                return session.user;
              }
              return prevUser;
            });
          } else {
            // Force reload if session is still null after storage event
            setTimeout(() => window.location.reload(), 500);
          }
        });
      }
    };
    window.addEventListener('storage', handleStorage);

    // Listen for window focus to sync auth state
    const handleFocus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(prevUser => {
            if (!prevUser || prevUser.id !== session.user.id) {
              fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
              return session.user;
            }
            return prevUser;
          });
        } else if (localStorage.getItem('oauth_success')) {
          // If we have the success flag but no session, try reloading
          const successTime = parseInt(localStorage.getItem('oauth_success') || '0');
          if (Date.now() - successTime < 60000) { // Only if within last minute
             window.location.reload();
          }
        }
      });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
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
          displayName: displayName || 'İsimsiz Danışman',
          subscriptionType: 'none',
          subscriptionEndDate: null,
          role: 'agent',
          hasSeenOnboarding: false,
          hasSeenTour: false,
        };
      });
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(prev => {
        // If we have optimistic state that is "further along" than the DB, keep it
        // This prevents the UI from flashing back to the start screen if DB is slow or failing
        if (prev) {
          return {
            ...data as UserProfile,
            hasSeenOnboarding: prev.hasSeenOnboarding || data.hasSeenOnboarding,
            hasSeenTour: prev.hasSeenTour || data.hasSeenTour,
            subscriptionType: prev.subscriptionType !== 'none' ? prev.subscriptionType : data.subscriptionType,
            subscriptionEndDate: prev.subscriptionEndDate || data.subscriptionEndDate,
          };
        }
        return data as UserProfile;
      });
    } else {
      // Create initial profile
      const newProfile: UserProfile = {
        uid,
        email,
        displayName: displayName || 'İsimsiz Danışman',
        subscriptionType: 'none',
        subscriptionEndDate: null,
        role: 'agent',
        hasSeenOnboarding: false,
        hasSeenTour: false,
      };
      const { error: insertError } = await supabase.from('profiles').insert(newProfile);
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
    
    // Optimistic update to immediately let the user in (especially helpful if Supabase RLS policies aren't fully configured yet)
    setProfile(prev => {
      if (prev) {
        return { ...prev, subscriptionType: type, subscriptionEndDate: endDate };
      }
      return {
        uid: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.full_name || 'İsimsiz Danışman',
        subscriptionType: type,
        subscriptionEndDate: endDate,
        role: 'agent',
        hasSeenOnboarding: false,
        hasSeenTour: false,
      };
    });

    const { error } = await supabase
      .from('profiles')
      .update({
        subscriptionType: type,
        subscriptionEndDate: endDate,
      })
      .eq('uid', user.id);
    
    if (error) {
      console.error('Subscription error:', error);
      // In a real app, we might revert the optimistic update here if it fails
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, hasSeenOnboarding: true } : null);

    const { error } = await supabase
      .from('profiles')
      .update({ hasSeenOnboarding: true })
      .eq('uid', user.id);
    if (error) {
      console.error('Onboarding error:', error);
    }
  };

  const completeTour = async () => {
    if (!user) return;
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, hasSeenTour: true } : null);

    const { error } = await supabase
      .from('profiles')
      .update({ hasSeenTour: true })
      .eq('uid', user.id);
    if (error) {
      console.error('Tour error:', error);
    }
  };

  const isSubscribed = profile?.subscriptionEndDate 
    ? isAfter(parseISO(profile.subscriptionEndDate), new Date()) 
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
    <AuthContext.Provider value={{ user, profile, loading, isSubscribed, login, logout, subscribe, completeOnboarding, completeTour }}>
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
