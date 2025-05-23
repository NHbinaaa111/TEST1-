import { useState, useEffect, useRef } from 'react';
import { useConfetti } from '@/hooks/use-confetti-context';
import { usePomodoroContext } from '@/hooks/use-pomodoro-context';
import { useStreak } from '@/hooks/use-streak-context';
import { useStudySessions } from '@/hooks/use-study-sessions';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  BookOpen
} from 'lucide-react';

// Define the types of phases in the pomodoro cycle
type TimerPhase = 'work' | 'break' | 'longBreak';

// Define the timer settings interface
interface TimerSettings {
  workTime: number;
  breakTime: number;
  longBreakTime: number;
  cycles: number;
  soundEnabled: boolean;
}

export default function PomodoroTimer() {
  // Get confetti launcher and streak context
  const { launchConfetti } = useConfetti();
  const { recordSession, logStudySession } = useStreak();
  const { createSession } = useStudySessions();
  const { toast } = useToast();
  
  // Get pomodoro state from context for persistence across routes
  const { 
    timeLeft, setTimeLeft,
    isPaused, setIsPaused,
    isActive, setIsActive,
    phase, setPhase,
    completedCycles, setCompletedCycles,
    settings, updateSettings: setSettings,
    sessionCompleted, setSessionCompleted,
    startTimestamp, setStartTimestamp,
    currentPhaseDuration, setCurrentPhaseDuration,
    completedWorkSessions, setCompletedWorkSessions
  } = usePomodoroContext();

  // Local states for UI and timer control
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if timer is still active on mount and start interval if needed
  useEffect(() => {
    // If the timer has a startTimestamp and is active but not paused
    if (startTimestamp && isActive && !isPaused) {
      // Calculate the current time left based on the elapsed time since startTimestamp
      const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
      const remaining = currentPhaseDuration - elapsed;
      
      // Update the time left if it's different than what we have and valid
      if (remaining > 0) {
        // Update the displayed time to match the actual elapsed time
        setTimeLeft(remaining);
        
        // Create a new interval to continue the countdown
        const newInterval = setInterval(() => {
          // Use a callback to access the most current timeLeft value
          setTimeLeft((current: number) => {
            if (current <= 1) {
              clearInterval(newInterval);
              handlePhaseComplete();
              return 0;
            }
            return current - 1;
          });
        }, 1000);
        
        // Save the interval ID
        setIntervalId(newInterval);
      } else {
        // Time has elapsed completely while away, trigger phase completion
        handlePhaseComplete();
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount

  // Initialize audio with user interaction handling
  useEffect(() => {
    // Create initial audio references
    audioRef.current = new Audio('/sounds/end-session.mp3');
    
    // Handle autoplay restrictions by preloading audio files
    const preloadAudio = () => {
      if (audioRef.current) {
        // Set volume to 0 to prevent any sound during preloading
        audioRef.current.volume = 0;
        audioRef.current.play()
          .then(() => {
            audioRef.current?.pause();
            audioRef.current!.volume = 1; // Reset volume
            audioRef.current!.currentTime = 0;
          })
          .catch(e => console.warn('Audio preload failed, user interaction may be required:', e));
      }
    };

    // Attempt preload on mount
    preloadAudio();
    
    // Add click listener to document to enable audio on first interaction
    const handleDocumentClick = () => preloadAudio();
    document.addEventListener('click', handleDocumentClick, { once: true });
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Reset timer when settings change and timer is not active
  useEffect(() => {
    if (!intervalId && !isPaused) {
      if (phase === 'work') setTimeLeft(settings.workTime * 60);
      else if (phase === 'break') setTimeLeft(settings.breakTime * 60);
      else setTimeLeft(settings.longBreakTime * 60);
    }
  }, [settings, phase, intervalId, isPaused]);

  // Handle session completion and sound
  useEffect(() => {
    if (timeLeft === 0 && sessionCompleted) {
      // Play appropriate sound based on phase
      if (audioRef.current) {
        const soundPath = phase === 'work' ? '/sounds/end-session.mp3' : '/sounds/start-session.mp3';
        audioRef.current.src = soundPath;
        
        if (settings.soundEnabled) {
          audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        }
      }
      
      setSessionCompleted(false);
    }
  }, [sessionCompleted, settings.soundEnabled, timeLeft, phase]);

  // Pause timer function
  const pauseTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsPaused(true);
    // When pausing, we want to remember where we paused, so we DON'T clear the timestamp
    // This allows us to calculate elapsed time even after page navigation
  };

  // Resume timer function
  const resumeTimer = () => {
    // When resuming, we need to calculate a new startTimestamp that accounts for time already elapsed
    // So that when we navigate away and come back, it continues from the correct point
    
    // Calculate a corrected timestamp that accounts for already elapsed time
    // Current phase duration - timeLeft gives us how many seconds have already elapsed
    const elapsedSeconds = currentPhaseDuration - timeLeft;
    // Set a new start timestamp that's adjusted to account for the elapsed time
    const adjustedStartTime = Date.now() - (elapsedSeconds * 1000);
    setStartTimestamp(adjustedStartTime);
    
    const newInterval = setInterval(() => {
      // Use a callback to access the most current timeLeft value
      setTimeLeft((current: number) => {
        if (current <= 1) {
          clearInterval(newInterval);
          handlePhaseComplete();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    
    setIntervalId(newInterval);
    setIsPaused(false);
  };

  // Start timer function
  const startTimer = () => {
    // Set start timestamp for persistence
    setStartTimestamp(Date.now());
    
    // Calculate and set the full duration of the current phase
    let fullDuration = 0;
    if (phase === 'work') {
      fullDuration = settings.workTime * 60;
      
      // Ensure we have a subject selected before starting a work session
      if (!selectedSubject || selectedSubject === '') {
        setSelectedSubject('General Study');
      }
    } else if (phase === 'break') {
      fullDuration = settings.breakTime * 60;
    } else {
      fullDuration = settings.longBreakTime * 60;
    }
    setCurrentPhaseDuration(fullDuration);
    
    // Start the timer
    setIsActive(true);
    resumeTimer(); // Reuse the resume logic
  };

  // JEE subject options
  const jeeSubjects = ['Mathematics', 'Physics', 'Chemistry', 'General Study'];
  
  // Get subject from context instead of local state
  const { selectedSubject, setSelectedSubject } = usePomodoroContext();

  // Handle subject selection
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };

  // Handle phase completion
  const handlePhaseComplete = () => {
    // Set session completed flag to trigger sound
    setSessionCompleted(true);
    
    // Move to next phase
    if (phase === 'work') {
      const newCompletedCycles = completedCycles + 1;
      setCompletedCycles(newCompletedCycles);
      
      // Track completed work sessions
      const newCompletedSessions = completedWorkSessions + 1;
      setCompletedWorkSessions(newCompletedSessions);
      
      // Trigger confetti celebration when a work session is completed
      launchConfetti('study-session-complete');
      
      // Make sure we have a subject - default to General Study if none selected
      const currentSubject = selectedSubject || 'General Study';
      
      // Record completed session for streak tracking with the selected subject and actual duration
      logStudySession(currentSubject, undefined, 'pomodoro', settings.workTime);
      
      // Create a study session entry in the database
      const now = new Date();
      const startTime = new Date(now.getTime() - (settings.workTime * 60 * 1000)); // Calculate start time from duration
      
      console.log("Creating Pomodoro study session:", {
        subject: currentSubject,
        duration: settings.workTime * 60,
        startTime: startTime,
        endTime: now
      });
      
      createSession({
        taskName: `Pomodoro Session - ${currentSubject}`,
        subject: currentSubject,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        duration: settings.workTime * 60, // Convert minutes to seconds
        date: new Date().toISOString().split('T')[0], // Add date in YYYY-MM-DD format
        notes: `Pomodoro Session (${settings.workTime} min)`
      }).then(session => {
        if (session) {
          console.log("Successfully created study session from Pomodoro:", session);
          
          // Dispatch event to update dashboard widgets with new study session data
          const studySessionEvent = new CustomEvent('study-session-updated', {
            detail: {
              sessionId: session.id,
              duration: settings.workTime * 60, // Convert minutes to seconds
              subject: currentSubject,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(studySessionEvent);
          
          // Check if this session brings the user to 1+ hour of study today
          const dailyTotal = newCompletedSessions * settings.workTime;
          
          // Show different toast for reaching milestone
          if (dailyTotal >= 60 && dailyTotal - settings.workTime < 60) {
            toast({
              title: "Streak Day Achieved! 🔥",
              description: `You've reached 1+ hour of study today and earned a streak day!`,
              variant: "default"
            });
          } else {
            toast({
              title: "Pomodoro Session Logged",
              description: `${settings.workTime} minute ${currentSubject} session has been recorded.`,
              variant: "default"
            });
          }
        }
      }).catch(err => {
        console.error('Error logging Pomodoro session:', err);
        toast({
          title: "Error Logging Session",
          description: "Failed to record your Pomodoro session. Please try again.",
          variant: "destructive"
        });
      });
      
      // Check if we need a long break
      let newPhase: TimerPhase = 'break';
      let newDuration = settings.breakTime * 60;
      
      if (newCompletedCycles % settings.cycles === 0) {
        newPhase = 'longBreak';
        newDuration = settings.longBreakTime * 60;
      }
      
      setPhase(newPhase);
      setTimeLeft(newDuration);
      setCurrentPhaseDuration(newDuration);
    } else {
      // After any break, go back to work
      const newDuration = settings.workTime * 60;
      setPhase('work');
      setTimeLeft(newDuration);
      setCurrentPhaseDuration(newDuration);
    }
    
    // Reset interval state after a session is complete
    setIntervalId(null);
    setIsPaused(false);
    setStartTimestamp(null);
  };

  // Handle start/pause/resume button
  const toggleTimer = () => {
    if (intervalId) {
      // Timer is running, pause it
      pauseTimer();
    } else if (isPaused) {
      // Timer is paused, resume it
      resumeTimer();
    } else {
      // Timer is stopped, start it
      startTimer();
    }
  };

  // Handle reset button
  const resetTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    // Reset all timer state
    setIsPaused(false);
    setIsActive(false);
    setPhase('work');
    setCompletedCycles(0);
    setTimeLeft(settings.workTime * 60);
    setSessionCompleted(false);
    setStartTimestamp(null);
    setCurrentPhaseDuration(settings.workTime * 60);
  };

  // Update settings
  const updateSettings = (updatedSettings: Partial<TimerSettings>) => {
    setSettings(updatedSettings);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the progress bar
  const calculateProgress = (): number => {
    let totalTime = 0;
    if (phase === 'work') totalTime = settings.workTime * 60;
    else if (phase === 'break') totalTime = settings.breakTime * 60;
    else totalTime = settings.longBreakTime * 60;
    
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <Card className="w-full max-w-md mx-auto border-t-4 border-t-purple-600 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Pomodoro Timer</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-slate-800"
            disabled={isActive && !isPaused} // Disable settings button when timer is active
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {showSettings ? (
          <div className="space-y-4 py-2">
            <h3 className="text-sm font-medium">Timer Settings</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label htmlFor="workTime">Work Time: {settings.workTime} min</Label>
                </div>
                <Slider
                  id="workTime"
                  min={1}
                  max={60}
                  step={1}
                  value={[settings.workTime]}
                  onValueChange={(value) => updateSettings({ workTime: value[0] })}
                  disabled={isActive} // Disable during active sessions
                  className={isActive ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label htmlFor="breakTime">Break Time: {settings.breakTime} min</Label>
                </div>
                <Slider
                  id="breakTime"
                  min={1}
                  max={30}
                  step={1}
                  value={[settings.breakTime]}
                  onValueChange={(value) => updateSettings({ breakTime: value[0] })}
                  disabled={isActive} // Disable during active sessions
                  className={isActive ? "opacity-60" : ""}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label htmlFor="longBreakTime">Long Break: {settings.longBreakTime} min</Label>
                </div>
                <Slider
                  id="longBreakTime"
                  min={5}
                  max={60}
                  step={5}
                  value={[settings.longBreakTime]}
                  onValueChange={(value) => updateSettings({ longBreakTime: value[0] })}
                  disabled={isActive} // Disable during active sessions
                  className={isActive ? "opacity-60" : ""}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label htmlFor="cycles">Cycles until Long Break: {settings.cycles}</Label>
                </div>
                <Slider
                  id="cycles"
                  min={1}
                  max={8}
                  step={1}
                  value={[settings.cycles]}
                  onValueChange={(value) => updateSettings({ cycles: value[0] })}
                  disabled={isActive} // Disable during active sessions
                  className={isActive ? "opacity-60" : ""}
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="sound" className="cursor-pointer">Sound Notifications</Label>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  disabled={isActive} // Disable during active sessions
                  className={isActive ? "opacity-60" : ""}
                >
                  {settings.soundEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div 
              className="flex flex-col items-center justify-center"
              style={{ minHeight: '150px' }}
            >
              <div className="text-4xl font-bold tracking-widest mb-2">
                {formatTime(timeLeft)}
              </div>
              
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    phase === 'work' ? 'bg-purple-600' : phase === 'break' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              
              <div className="mt-5 text-sm font-medium uppercase tracking-wide">
                <span className={`px-3 py-1 rounded-full ${
                  phase === 'work' 
                    ? 'bg-purple-900/40 text-purple-300' 
                    : phase === 'break' 
                      ? 'bg-green-900/40 text-green-300' 
                      : 'bg-blue-900/40 text-blue-300'
                }`}>
                  {phase === 'work' ? 'Focus Time' : phase === 'break' ? 'Short Break' : 'Long Break'}
                </span>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                Cycle: {completedCycles % settings.cycles || settings.cycles} / {settings.cycles}
              </div>

              {/* JEE Subject Selector */}
              {phase === 'work' && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    <Label htmlFor="subject" className="text-sm">Studying:</Label>
                  </div>
                  <Select 
                    value={selectedSubject} 
                    onValueChange={handleSubjectChange}
                    disabled={isActive} // Disable subject change during all active sessions
                  >
                    <SelectTrigger className={`mt-1 w-full bg-slate-800 border-slate-700 ${isActive ? 'opacity-70' : ''}`}>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {jeeSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center space-x-2 pt-0">
        {!showSettings && (
          <>
            <Button
              onClick={toggleTimer}
              variant="outline"
              className={intervalId ? 'bg-red-900/30 hover:bg-red-800/50 border-red-700' : isPaused ? 'bg-yellow-900/30 hover:bg-yellow-800/50 border-yellow-700' : 'bg-green-900/30 hover:bg-green-800/50 border-green-700'}
            >
              {intervalId ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
              {intervalId ? 'Pause' : isPaused ? 'Resume' : 'Start'}
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
              className="bg-gray-900/30 hover:bg-gray-800/50 border-gray-700"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}