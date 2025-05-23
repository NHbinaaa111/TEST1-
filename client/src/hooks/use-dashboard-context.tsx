import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './use-auth';

// Define the context type
interface DashboardContextType {
  overallProgress: number;
  setOverallProgress: (value: number) => void;
  tasksRatio: { completed: number; total: number };
  setTasksRatio: (value: { completed: number; total: number }) => void;
  weeklyStudyHours: number;
  setWeeklyStudyHours: (value: number) => void;
  updateOverallProgress: (value: number) => void;
  updateTasksRatio: (completed: number, total: number) => void;
  updateWeeklyStudyHours: (value: number) => void;
}

// Create context with default values
const DashboardContext = createContext<DashboardContextType>({
  overallProgress: 0,
  setOverallProgress: () => {},
  tasksRatio: { completed: 0, total: 0 },
  setTasksRatio: () => {},
  weeklyStudyHours: 0,
  setWeeklyStudyHours: () => {},
  updateOverallProgress: () => {},
  updateTasksRatio: () => {},
  updateWeeklyStudyHours: () => {},
});

// Provider component
export const DashboardProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [tasksRatio, setTasksRatio] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [weeklyStudyHours, setWeeklyStudyHours] = useState<number>(0);

  // Function to update overall progress and emit an event
  const updateOverallProgress = (value: number) => {
    setOverallProgress(value);
    
    // Also update the progress in localStorage for persistence
    if (user) {
      const progressCache = JSON.parse(localStorage.getItem('chadjee_progress_cache') || '{}');
      progressCache.overall = value;
      localStorage.setItem('chadjee_progress_cache', JSON.stringify(progressCache));
    }
  };

  // Function to update tasks ratio and emit an event 
  const updateTasksRatio = (completed: number, total: number) => {
    setTasksRatio({ completed, total });
    
    // Store in localStorage for persistence
    if (user) {
      localStorage.setItem(`chadjee_tasks_ratio_${user.id}`, JSON.stringify({ completed, total }));
    }
  };

  // Function to update weekly study hours and emit an event
  const updateWeeklyStudyHours = (value: number) => {
    setWeeklyStudyHours(value);
    
    // Store in localStorage for persistence
    if (user) {
      localStorage.setItem(`chadjee_weekly_hours_${user.id}`, value.toString());
    }
  };

  // Listen for syllabus progress updates
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.overall === 'number') {
        setOverallProgress(event.detail.overall);
      }
    };

    // Listen for task updates
    const handleTaskUpdate = () => {
      if (!user) return;
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch tasks for today from the API or localStorage
      fetch(`/api/users/${user.id}/tasks`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(tasks => {
          if (Array.isArray(tasks)) {
            const todayTasks = tasks.filter(task => task.date === today);
            const completed = todayTasks.filter(task => task.completed).length;
            const total = todayTasks.length;
            updateTasksRatio(completed, total);
          }
        })
        .catch(err => console.error('Error fetching tasks:', err));
    };

    // Listen for study session updates
    const handleStudySessionUpdate = () => {
      if (!user) return;
      
      fetch(`/api/users/${user.id}/study-sessions`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(sessions => {
          if (Array.isArray(sessions)) {
            // Calculate hours from last 7 days
            const now = new Date();
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - 7);
            
            const lastWeekSessions = sessions.filter(session => {
              if (!session || !session.startTime) return false;
              const sessionDate = new Date(session.startTime);
              return sessionDate >= lastWeekStart;
            });
            
            let totalMinutes = 0;
            lastWeekSessions.forEach(session => {
              if (!session) return;
              
              if (session.duration) {
                totalMinutes += session.duration / 60; // Convert seconds to minutes
              } else if (session.startTime && session.endTime) {
                const start = new Date(session.startTime);
                const end = new Date(session.endTime);
                totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
              }
            });
            
            // Convert to hours with 1 decimal place
            const hours = Math.round(totalMinutes / 6) / 10;
            updateWeeklyStudyHours(hours);
          }
        })
        .catch(err => console.error('Error fetching study sessions:', err));
    };

    // Add custom event listeners
    window.addEventListener('subject-progress-updated', handleProgressUpdate as EventListener);
    window.addEventListener('task-updated', handleTaskUpdate);
    window.addEventListener('study-session-updated', handleStudySessionUpdate);

    // Load initial data from localStorage
    if (user) {
      try {
        const progressCache = JSON.parse(localStorage.getItem('chadjee_progress_cache') || '{}');
        if (progressCache.overall) {
          setOverallProgress(progressCache.overall);
        }
        
        const tasksRatioCache = localStorage.getItem(`chadjee_tasks_ratio_${user.id}`);
        if (tasksRatioCache) {
          setTasksRatio(JSON.parse(tasksRatioCache));
        }
        
        const weeklyHoursCache = localStorage.getItem(`chadjee_weekly_hours_${user.id}`);
        if (weeklyHoursCache) {
          setWeeklyStudyHours(parseFloat(weeklyHoursCache));
        }
      } catch (error) {
        console.error('Error loading dashboard cache:', error);
      }
    }

    // Also trigger initial data load
    handleTaskUpdate();
    handleStudySessionUpdate();

    // Cleanup
    return () => {
      window.removeEventListener('subject-progress-updated', handleProgressUpdate as EventListener);
      window.removeEventListener('task-updated', handleTaskUpdate);
      window.removeEventListener('study-session-updated', handleStudySessionUpdate);
    };
  }, [user]);

  // Provide the context value
  const contextValue = {
    overallProgress,
    setOverallProgress,
    tasksRatio,
    setTasksRatio,
    weeklyStudyHours,
    setWeeklyStudyHours,
    updateOverallProgress,
    updateTasksRatio,
    updateWeeklyStudyHours,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use the dashboard context
export const useDashboardContext = () => useContext(DashboardContext);