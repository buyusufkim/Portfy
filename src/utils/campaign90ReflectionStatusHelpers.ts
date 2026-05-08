export function calculateReflectionMetrics(
  uAns: any[], 
  cStatus: string, 
  todayStr: string, 
  nowMs: number, 
  getTurkeyTodayISO: (date: Date) => string
) {
  uAns.sort((a,b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime());
  const totalAnsweredDays = uAns.length;
  const lastAns = uAns[0];
  
  const lastAnswerAt = lastAns ? lastAns.answered_at : null;
  const lastAnswerDayNumber = lastAns ? lastAns.day_number : null;
  
  let daysSinceLastAnswer = -1;
  let answeredToday = false;
  let missingTodayAnswer = false;
  let reflectionStatus: "answered_today" | "missing_today" | "stale" | "none" = 'none';

  if (lastAnswerAt) {
     const ansDayIso = getTurkeyTodayISO(new Date(lastAnswerAt));
     answeredToday = (ansDayIso === todayStr);
     
     const lastMs = new Date(lastAnswerAt).getTime();
     daysSinceLastAnswer = Math.floor((nowMs - lastMs) / (1000 * 3600 * 24));
  }

  if (totalAnsweredDays > 0) {
      if (answeredToday) {
          reflectionStatus = 'answered_today';
      } else {
          reflectionStatus = daysSinceLastAnswer >= 3 ? 'stale' : 'missing_today';
          if (cStatus === 'active') missingTodayAnswer = true;
      }
  } else {
      if (cStatus === 'active') missingTodayAnswer = true;
  }

  return {
    lastAnswerAt,
    lastAnswerDayNumber,
    totalAnsweredDays,
    answeredToday,
    missingTodayAnswer,
    daysSinceLastAnswer,
    reflectionStatus
  };
}
