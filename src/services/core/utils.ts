import { supabase } from '../../lib/supabase';

// Cache user ID to avoid concurrent getUser() calls which cause "lock stolen" errors
let _cachedUserId: string | null = null;

// Listen for auth changes to keep cache in sync
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    _cachedUserId = session?.user?.id || null;
  } else if (event === 'SIGNED_OUT') {
    _cachedUserId = null;
  }
});

export const getUserId = async () => {
  if (_cachedUserId) return _cachedUserId;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    _cachedUserId = session.user.id;
    return _cachedUserId;
  }
  // Fallback to getUser if session is not available but might be valid
  const { data: { user } } = await supabase.auth.getUser();
  _cachedUserId = user?.id || null;
  return _cachedUserId;
};

export const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
