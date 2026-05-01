import { supabase } from "../../lib/supabase";

// Cache user ID to avoid concurrent getUser() calls which cause "lock stolen" errors
let _cachedUserId: string | null = null;

// Listen for auth changes to keep cache in sync
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    _cachedUserId = session.user.id;
  } else {
    _cachedUserId = null;
  }
});

export const getUserId = async () => {
  if (_cachedUserId) return _cachedUserId;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    _cachedUserId = session.user.id;
    return _cachedUserId;
  }
  // Fallback to getUser if session is not available but might be valid
  const {
    data: { user },
  } = await supabase.auth.getUser();
  _cachedUserId = user?.id || null;
  return _cachedUserId;
};

let globalServerOffset = 0;

export const setGlobalServerOffset = (offset: number) => {
  globalServerOffset = offset;
};

export const getSyncedDate = (): Date => {
  return new Date(Date.now() + globalServerOffset);
};

export const getTodayStrFromDate = (date: Date): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Istanbul",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

export const getTodayStr = (d?: Date) => {
  return getTodayStrFromDate(d || getSyncedDate());
};
