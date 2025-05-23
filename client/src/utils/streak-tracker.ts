import { StudySession } from '@/hooks/use-study-sessions';

// Minimum daily study time to count towards streak (in minutes)
const MIN_DAILY_STUDY_TIME = 60;

/**
 * Groups study sessions by date and calculates total duration for each day
 */
export function groupSessionsByDate(sessions: StudySession[]): Record<string, number> {
  const dailyDurations: Record<string, number> = {};
  
  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  
  // Group by date and sum durations
  sortedSessions.forEach(session => {
    const date = new Date(session.startTime).toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!dailyDurations[date]) {
      dailyDurations[date] = 0;
    }
    dailyDurations[date] += session.duration;
  });
  
  return dailyDurations;
}

/**
 * Calculates the current streak based on study sessions
 */
export function calculateStreak(sessions: StudySession[]): number {
  if (!sessions.length) return 0;
  
  const dailyDurations = groupSessionsByDate(sessions);
  const dates = Object.keys(dailyDurations).sort().reverse(); // Sort dates in descending order
  
  // Filter out days that don't meet the minimum time threshold
  const validDates = dates.filter(date => dailyDurations[date] >= MIN_DAILY_STUDY_TIME);
  
  if (!validDates.length) return 0;
  
  let streak = 1; // Start with the most recent day
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // 24 hours ago
  
  // If the most recent session is not from today or yesterday, streak is broken
  if (validDates[0] !== today && validDates[0] !== yesterday) {
    return 0;
  }
  
  // Count consecutive days
  for (let i = 1; i < validDates.length; i++) {
    const currentDate = new Date(validDates[i]);
    const previousDate = new Date(validDates[i-1]);
    
    // Check if dates are consecutive
    const diffDays = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }
  
  return streak;
}

/**
 * Checks if deleting a session would reset the streak
 */
export function wouldDeleteResetStreak(sessions: StudySession[], sessionToDelete: StudySession): boolean {
  if (!sessions.length) return false;
  
  // Get the date of the session to delete
  const deleteDate = new Date(sessionToDelete.startTime).toISOString().split('T')[0];
  
  // Create a new array without the session to be deleted
  const remainingSessions = sessions.filter(session => session.id !== sessionToDelete.id);
  
  // Find all sessions on the same day as the session to delete
  const sessionsOnSameDay = remainingSessions.filter(session => {
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    return sessionDate === deleteDate;
  });
  
  // Calculate total duration for the day without the session to delete
  const totalDurationWithoutSession = sessionsOnSameDay.reduce(
    (total, session) => total + session.duration, 0
  );
  
  // If it's the last session of the day or removing it would bring total below threshold
  if (sessionsOnSameDay.length === 0 || totalDurationWithoutSession < MIN_DAILY_STUDY_TIME) {
    // Calculate current streak and streak without this session
    const currentStreak = calculateStreak(sessions);
    const streakWithoutSession = calculateStreak(remainingSessions);
    
    // If streak would decrease, it would reset
    return streakWithoutSession < currentStreak;
  }
  
  return false;
}
