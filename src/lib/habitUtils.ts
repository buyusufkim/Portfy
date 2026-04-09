export const XP_PER_LEVEL = 1000;

export const calculateLevel = (totalXP: number) => {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
};

export const calculateProgressToNextLevel = (totalXP: number) => {
  return (totalXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
};

export const getLevelName = (level: number) => {
  if (level >= 20) return 'Legendary Broker';
  if (level >= 15) return 'Master Producer';
  if (level >= 10) return 'Senior Associate';
  if (level >= 5) return 'Professional';
  return 'Rookie';
};

export const calculateStreak = (lastActiveDate: string | null, currentStreak: number): number => {
  if (!lastActiveDate) return 1;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastActive.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak + 1;
  return 1; // Streak broken
};
