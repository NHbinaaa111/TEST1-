import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define timer phase types
type TimerPhase = 'work' | 'break' | 'longBreak';

// Define timer settings interface
interface TimerSettings {
  workTime: number;
  breakTime: number;
  longBreakTime: number;
  cycles: number;
  soundEnabled: boolean;
}

// Define context interface
interface PomodoroContextType {
  // Timer state
  timeLeft: number;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  phase: TimerPhase;
  setPhase: (phase: TimerPhase) => void;
  completedCycles: number;
  setCompletedCycles: (cycles: number) => void;
  
  // Timer settings
  settings: TimerSettings;
  updateSettings: (settings: Partial<TimerSettings>) => void;
  
  // Control flags
  sessionCompleted: boolean;
  setSessionCompleted: (completed: boolean) => void;
  
  // Timestamp tracking for persistence
  startTimestamp: number | null;
  setStartTimestamp: (time: number | null) => void;
  currentPhaseDuration: number;
  setCurrentPhaseDuration: (duration: number) => void;
  
  // Session tracking
  completedWorkSessions: number;
  setCompletedWorkSessions: (count: number) => void;
  
  // Subject tracking (for JEE)
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
}

// Create the context with default values
const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

interface PomodoroProviderProps {
  children: ReactNode;
}

export function PomodoroProvider({ children }: PomodoroProviderProps) {
  // Default timer settings
  const defaultSettings: TimerSettings = {
    workTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    cycles: 4,
    soundEnabled: true
  };

  // Initialize settings from localStorage
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const savedSettings = localStorage.getItem('chadjee_pomodoro_settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Get saved timer state from localStorage
  const getSavedState = () => {
    const savedState = localStorage.getItem('chadjee_pomodoro_state');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  };
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedState = getSavedState();
    if (savedState && savedState.startTimestamp && !savedState.isPaused) {
      // Calculate remaining time based on timestamp if timer was running
      const elapsed = Math.floor((Date.now() - savedState.startTimestamp) / 1000);
      const remaining = savedState.currentPhaseDuration - elapsed;
      return remaining > 0 ? remaining : 0;
    } else if (savedState) {
      return savedState.timeLeft;
    }
    return settings.workTime * 60;
  });
  
  const [isPaused, setIsPaused] = useState(() => {
    const savedState = getSavedState();
    return savedState ? savedState.isPaused : false;
  });
  
  const [isActive, setIsActive] = useState(() => {
    const savedState = getSavedState();
    return savedState ? savedState.isActive : false;
  });
  
  const [phase, setPhase] = useState<TimerPhase>(() => {
    const savedState = getSavedState();
    return savedState ? savedState.phase : 'work';
  });
  
  const [completedCycles, setCompletedCycles] = useState(() => {
    const savedState = getSavedState();
    return savedState ? savedState.completedCycles : 0;
  });
  
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  // Timestamp tracking for persistence
  const [startTimestamp, setStartTimestamp] = useState<number | null>(() => {
    const savedState = getSavedState();
    if (savedState && savedState.startTimestamp && !savedState.isPaused) {
      return savedState.startTimestamp;
    }
    return null;
  });
  
  const [currentPhaseDuration, setCurrentPhaseDuration] = useState(() => {
    const savedState = getSavedState();
    if (savedState) {
      return savedState.currentPhaseDuration;
    }
    return settings.workTime * 60;
  });
  
  // Session tracking
  const [completedWorkSessions, setCompletedWorkSessions] = useState(() => {
    const savedState = getSavedState();
    return savedState ? savedState.completedWorkSessions || 0 : 0;
  });
  
  // Subject tracking for JEE
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const savedState = getSavedState();
    return savedState && savedState.selectedSubject ? savedState.selectedSubject : 'General Study';
  });

  // Persist settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chadjee_pomodoro_settings', JSON.stringify(settings));
  }, [settings]);

  // Update settings function
  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Update timeLeft in real-time based on elapsed time when timer is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isActive && !isPaused && startTimestamp) {
      // Create an interval that updates timeLeft every second based on elapsed time
      // Make sure we can assign this to a variable with proper type
      intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        const remaining = currentPhaseDuration - elapsed;
        
        if (remaining <= 0) {
          // Time's up - handle phase completion
          setTimeLeft(0);
          setIsActive(false);
          setStartTimestamp(null);
          setSessionCompleted(true);
          
          // Handle phase transition
          if (phase === 'work') {
            const newCompletedCycles = completedCycles + 1;
            setCompletedCycles(newCompletedCycles);
            
            // Track completed work sessions
            setCompletedWorkSessions((prev: number) => prev + 1);
            
            // Determine next phase
            if (newCompletedCycles % settings.cycles === 0) {
              setPhase('longBreak');
              setCurrentPhaseDuration(settings.longBreakTime * 60);
              setTimeLeft(settings.longBreakTime * 60);
            } else {
              setPhase('break');
              setCurrentPhaseDuration(settings.breakTime * 60);
              setTimeLeft(settings.breakTime * 60);
            }
          } else {
            // After any break, go back to work
            setPhase('work');
            setCurrentPhaseDuration(settings.workTime * 60);
            setTimeLeft(settings.workTime * 60);
          }
          
          // Safely clear the interval
          if (intervalId) {
            const id: NodeJS.Timeout = intervalId;
            clearInterval(id);
          }
        } else {
          // Update the remaining time
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        const id: NodeJS.Timeout = intervalId;
        clearInterval(id);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPaused, startTimestamp, currentPhaseDuration, phase, completedCycles, settings]);
  
  // Persist timer state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      timeLeft,
      isPaused,
      isActive,
      phase,
      completedCycles,
      startTimestamp,
      currentPhaseDuration,
      completedWorkSessions,
      selectedSubject, // Include the selected subject
      lastUpdated: Date.now() // Add a timestamp to track when the state was last saved
    };
    localStorage.setItem('chadjee_pomodoro_state', JSON.stringify(stateToSave));
  }, [timeLeft, isPaused, isActive, phase, completedCycles, startTimestamp, currentPhaseDuration, completedWorkSessions, selectedSubject]);

  // Provide the context value
  const value = {
    timeLeft,
    setTimeLeft,
    isPaused,
    setIsPaused,
    isActive,
    setIsActive,
    phase,
    setPhase,
    completedCycles,
    setCompletedCycles,
    settings,
    updateSettings,
    sessionCompleted,
    setSessionCompleted,
    startTimestamp,
    setStartTimestamp,
    currentPhaseDuration,
    setCurrentPhaseDuration,
    completedWorkSessions,
    setCompletedWorkSessions,
    selectedSubject,
    setSelectedSubject
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

// Custom hook to use the pomodoro context
export function usePomodoroContext() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
}
