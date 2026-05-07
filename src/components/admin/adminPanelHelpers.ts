import { UserProfile } from '../../types';
import { getEffectiveAiTokenLimit } from '../../config/subscriptionLimits';

export const getRemainingDays = (endDateStr?: string) => {
  if (!endDateStr) return null;
  const end = new Date(endDateStr);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 3650) return "Uzun Süreli Legacy Paket (Ömür Boyu)";
  if (diffDays < 0) return "Süresi Doldu";
  return `${diffDays} Gün Kaldı`;
};

export const getEffectiveAiTokenLimitSafe = (u: UserProfile) => {
  return getEffectiveAiTokenLimit(u);
};

export const getActiveUserFilter = (u: UserProfile) => {
  return u.subscription_end_date && new Date(u.subscription_end_date) >= new Date();
};

export const isPaidMasterUser = (u: UserProfile) => {
  return u.tier === 'master' && u.subscription_type !== 'trial' && getActiveUserFilter(u);
};

export const isActiveTrialUser = (u: UserProfile) => {
  return u.tier === 'master' && u.subscription_type === 'trial' && getActiveUserFilter(u);
};

export const isExpiredSubscriber = (u: UserProfile) => {
  return !!u.subscription_end_date && new Date(u.subscription_end_date) < new Date() && u.subscription_type !== 'none' && !isActiveTrialUser(u) && !isPaidMasterUser(u);
};

export const isFreeUser = (u: UserProfile) => {
  return !isPaidMasterUser(u) && !isActiveTrialUser(u) && !isExpiredSubscriber(u);
};

export const getMonthlyRevenueEquivalent = (u: UserProfile) => {
  if (isPaidMasterUser(u)) {
    const type = u.subscription_type || '';
    if (type.includes('1-month')) return 499;
    if (type.includes('3-month')) return 1250 / 3;
    if (type.includes('6-month')) return 1999 / 6;
    if (type.includes('12-month')) return 2999 / 12;
    return 499; // Varsayılan eski master'lar için
  }
  return 0;
};

export interface AdminDashboardMetrics {
  totalUsers: number;
  masterUsers: number;
  trialUsers: number;
  freeUsers: number;
  onlineToday: number;
  newUsers7d: number;
  active7d: number;
  topTokenUsers: UserProfile[];
  trialExpiring3dUsers: UserProfile[];
  expiredUsersList: UserProfile[];
  inactiveFor14dList: UserProfile[];
  approachingLimitUsers: UserProfile[];
  totalTokensUsed: number;
  estimatedAiCost: number;
  estimatedMRR: number;
  conversionRate: string;
}

export const buildAdminDashboardMetrics = (users: UserProfile[]): AdminDashboardMetrics => {
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const totalUsers = users.length;
  const masterUsers = users.filter(u => isPaidMasterUser(u)).length;
  const trialUsers = users.filter(u => isActiveTrialUser(u)).length;
  const freeUsers = users.filter(u => isFreeUser(u) || isExpiredSubscriber(u)).length;
  
  const onlineToday = users.filter(u => u.last_active_date && u.last_active_date.startsWith(todayStr)).length;
  const newUsers7d = users.filter(u => u.created_at && new Date(u.created_at) >= sevenDaysAgo).length;
  const active7d = users.filter(u => u.last_active_date && new Date(u.last_active_date) >= sevenDaysAgo).length;
  
  const topTokenUsers = [...users].sort((a,b) => (b.ai_tokens_used || 0) - (a.ai_tokens_used || 0)).slice(0, 5);
  
  const trialExpiring3dUsers = users.filter(u => {
      if(u.subscription_type !== 'trial' || !u.subscription_end_date) return false;
      const diff = new Date(u.subscription_end_date).getTime() - new Date().getTime();
      return diff > 0 && diff <= (3 * 24 * 60 * 60 * 1000);
  });
  
  const expiredUsersList = users.filter(u => u.subscription_end_date && new Date(u.subscription_end_date) < new Date() && u.subscription_type !== 'none');
  
  const inactiveFor14dList = users.filter(u => {
      if (!u.last_active_date) return false;
      const diff = new Date().getTime() - new Date(u.last_active_date).getTime();
      return diff > 14 * 24 * 60 * 60 * 1000;
  });

  const approachingLimitUsers = users.filter(u => {
    const lim = getEffectiveAiTokenLimitSafe(u);
    return lim > 0 && ((u.ai_tokens_used || 0) / lim) >= 0.8;
  });

  const totalTokensUsed = users.reduce((acc, u) => acc + (u.ai_tokens_used || 0), 0);
  const estimatedAiCost = (totalTokensUsed / 1000) * 0.05;
  
  const estimatedMRR = users.reduce((acc, u) => acc + getMonthlyRevenueEquivalent(u), 0);
  
  const conversionRate = totalUsers > 0 ? ((masterUsers / totalUsers) * 100).toFixed(1) : '0';

  return {
    totalUsers,
    masterUsers,
    trialUsers,
    freeUsers,
    onlineToday,
    newUsers7d,
    active7d,
    topTokenUsers,
    trialExpiring3dUsers,
    expiredUsersList,
    inactiveFor14dList,
    approachingLimitUsers,
    totalTokensUsed,
    estimatedAiCost,
    estimatedMRR,
    conversionRate
  };
};
