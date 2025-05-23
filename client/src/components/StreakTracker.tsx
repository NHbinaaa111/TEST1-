import React, { useEffect, useState } from 'react';
import { Flame, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
// Using a simplified StudySession interface for the component
interface StudySession {
  id: string;
  taskName: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  date: string;
}

// Minimum daily study time to count towards streak (in minutes)
const MIN_DAILY_STUDY_TIME = 60;

interface StreakTrackerProps {
  studySessions: StudySession[];
}

export default function StreakTracker({ studySessions }: StreakTrackerProps) {
  const [streak, setStreak] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  
  useEffect(() => {
    if (!studySessions?.length) {
      setStreak(0);
      setTodayMinutes(0);
      return;
    }
    
    // Sort sessions by date (newest first)
    const sortedSessions = [...studySessions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Group sessions by date and calculate total duration for each day
    const dailyDurations = new Map<string, number>();
    sortedSessions.forEach(session => {
      const dateKey = new Date(session.date).toISOString().split('T')[0];
      if (!dailyDurations.has(dateKey)) {
        dailyDurations.set(dateKey, 0);
      }
      // Convert seconds to minutes for the duration
      const durationInMinutes = Math.round(session.duration / 60);
      dailyDurations.set(dateKey, (dailyDurations.get(dateKey) || 0) + durationInMinutes);
    });
    
    // Calculate streak (consecutive days with ≥ 1 hour study time)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user studied enough today
    const todayKey = today.toISOString().split('T')[0];
    const todayDuration = dailyDurations.get(todayKey) || 0;
    setTodayMinutes(todayDuration); // Store today's minutes for UI
    
    const hasStudiedEnoughToday = todayDuration >= MIN_DAILY_STUDY_TIME;
    
    if (hasStudiedEnoughToday) {
      currentStreak = 1;
      
      // Check previous days
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
      
      while (true) {
        const dateKey = checkDate.toISOString().split('T')[0];
        const dayDuration = dailyDurations.get(dateKey) || 0;
        if (dayDuration >= MIN_DAILY_STUDY_TIME) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      // Check if user studied enough yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];
      const yesterdayDuration = dailyDurations.get(yesterdayKey) || 0;
      
      if (yesterdayDuration >= MIN_DAILY_STUDY_TIME) {
        currentStreak = 1;
        
        // Check previous days
        let checkDate = new Date(yesterday);
        checkDate.setDate(checkDate.getDate() - 1);
        
        while (true) {
          const dateKey = checkDate.toISOString().split('T')[0];
          const dayDuration = dailyDurations.get(dateKey) || 0;
          if (dayDuration >= MIN_DAILY_STUDY_TIME) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }
    
    setStreak(currentStreak);
  }, [studySessions]);
  
  // Calculate progress percentage toward daily goal
  const progressPercent = Math.min(100, (todayMinutes / MIN_DAILY_STUDY_TIME) * 100);
  const minutesRemaining = Math.max(0, MIN_DAILY_STUDY_TIME - todayMinutes);
  
  // Determine streak status for visual cues
  const hasReachedDailyGoal = todayMinutes >= MIN_DAILY_STUDY_TIME;
  
  // Show a different badge if there's no streak
  if (streak === 0) {
    return (
      <motion.div 
        className={`flex flex-col gap-1 bg-opacity-90 ${hasReachedDailyGoal ? 'bg-gradient-to-r from-[#3a3a3a] to-[#505050]' : 'bg-gradient-to-r from-gray-600 to-gray-700'} text-white px-3 py-2 rounded-lg text-sm font-medium`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Flame className={`h-4 w-4 ${hasReachedDailyGoal ? 'text-orange-400' : 'text-gray-300'} mr-2`} />
            <span>No active streak</span>
          </div>
          <div className="text-xs text-gray-300 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {todayMinutes}/{MIN_DAILY_STUDY_TIME}min
          </div>
        </div>
        
        {/* Progress bar to show 1 hour completion status */}
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
          <div 
            className={`h-1.5 rounded-full ${hasReachedDailyGoal ? 'bg-[#00EEFF]' : 'bg-gray-500'}`} 
            style={{width: `${progressPercent}%`}}
          ></div>
        </div>
        
        {/* Message showing minutes needed */}
        {!hasReachedDailyGoal && (
          <div className="text-xs text-gray-300 mt-1">
            {minutesRemaining} more min needed today for streak
          </div>
        )}
        {hasReachedDailyGoal && (
          <div className="text-xs text-[#00EEFF] mt-1">
            Daily goal met! Study again tomorrow to start a streak.
          </div>
        )}
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="flex flex-col gap-1 bg-opacity-90 bg-gradient-to-r from-[#FF5F00] to-[#FF9500] text-white px-3 py-2 rounded-lg text-sm font-medium shadow-[0_0_10px_rgba(255,95,0,0.5)]"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Flame className="h-4 w-4 text-yellow-100 mr-2" />
          <span className="font-bold">{streak} day{streak !== 1 ? 's' : ''} streak</span>
        </div>
        <div className="text-xs text-yellow-100 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {todayMinutes}/{MIN_DAILY_STUDY_TIME}min
        </div>
      </div>
      
      {/* Progress bar to show today's completion */}
      <div className="w-full bg-[#9B3A00]/50 rounded-full h-1.5 mt-1">
        <div 
          className="h-1.5 rounded-full bg-yellow-100" 
          style={{width: `${progressPercent}%`}}
        ></div>
      </div>
      
      {/* Message showing streak status */}
      {!hasReachedDailyGoal && (
        <div className="text-xs text-yellow-100 mt-1">
          {minutesRemaining} more min needed today to maintain streak
        </div>
      )}
      {hasReachedDailyGoal && (
        <div className="text-xs text-yellow-100 mt-1">
          Daily goal met! Keep your streak going tomorrow.
        </div>
      )}
    </motion.div>
  );
}