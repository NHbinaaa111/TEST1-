import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  Clock, 
  Edit2, 
  Save, 
  X, 
  Calendar,
  BarChart,
  Trash2
} from 'lucide-react';

interface StudySession {
  id: string;
  taskName: string;
  subject?: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
  date: string;
}

interface DailyStudyData {
  date: string;
  totalDuration: number; // in seconds
  sessions: StudySession[];
}

interface WeeklyStudyData {
  weekStartDate: string;
  totalDuration: number; // in seconds
  dailyDurations: { [date: string]: number }; // date -> seconds
}

export default function StudyHoursTracker() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  // Session state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [taskName, setTaskName] = useState('Studying');
  const [selectedSubject, setSelectedSubject] = useState('General Study');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editedTaskName, setEditedTaskName] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  
  // JEE subject options
  const jeeSubjects = ['Mathematics', 'Physics', 'Chemistry', 'General Study'];
  
  // Data state
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [dailyStudyData, setDailyStudyData] = useState<DailyStudyData[]>([]);
  const [weeklyStudyData, setWeeklyStudyData] = useState<WeeklyStudyData[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Load study data when user changes
  useEffect(() => {
    if (user) {
      loadStudyData();
    }
  }, [user]);

  // When active session is ongoing, update elapsed time
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (activeSession) {
      intervalId = window.setInterval(() => {
        const now = new Date();
        const startTime = new Date(activeSession.startTime);
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsedSeconds);
      }, 1000);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [activeSession]);

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  // Format time as decimal hours (e.g., 1.5 hours)
  const formatHours = (totalSeconds: number): string => {
    const hours = totalSeconds / 3600;
    return hours.toFixed(1);
  };

  // Load all study data from the database via API
  const loadStudyData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch study sessions
      const response = await fetch(`/api/users/${user.id}/study-sessions`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load study sessions');
      }
      
      const loadedSessions = await response.json();
      setStudySessions(loadedSessions);
      
      // Check if there's an active session
      const activeSessionResponse = await fetch(`/api/users/${user.id}/active-study-session`, {
        credentials: 'include',
      });
      
      if (activeSessionResponse.ok) {
        const loadedActiveSession = await activeSessionResponse.json();
        if (loadedActiveSession) {
          setActiveSession(loadedActiveSession);
          setTaskName(loadedActiveSession.taskName);
          
          // Calculate elapsed time
          const now = new Date();
          const startTime = new Date(loadedActiveSession.startTime);
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setElapsedTime(elapsedSeconds);
        }
      }
      
      // Process sessions into daily and weekly data
      processStudyData(loadedSessions);
      
    } catch (error) {
      console.error('Error loading study data:', error);
      // Initialize with empty sessions to avoid breaking the UI
      setStudySessions([]);
      processStudyData([]);
      
      toast({
        title: "Error loading data",
        description: "There was a problem loading your study sessions. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process sessions into daily and weekly summaries
  const processStudyData = (sessions: StudySession[]) => {
    // 1. Group sessions by date
    const sessionsByDate: Record<string, StudySession[]> = {};
    sessions.forEach(session => {
      if (!sessionsByDate[session.date]) {
        sessionsByDate[session.date] = [];
      }
      sessionsByDate[session.date].push(session);
    });
    
    // 2. Create daily data
    const daily: DailyStudyData[] = Object.keys(sessionsByDate).map(date => {
      const dateSessions = sessionsByDate[date];
      const totalDuration = dateSessions.reduce((sum, session) => sum + session.duration, 0);
      return {
        date,
        totalDuration,
        sessions: dateSessions
      };
    });
    
    // Sort by date descending (newest first)
    daily.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setDailyStudyData(daily);
    
    // 3. Create weekly data
    const getWeekStartDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
      const mondayDate = new Date(date.setDate(diff));
      return mondayDate.toISOString().split('T')[0];
    };
    
    const weeklyMap: Record<string, { 
      totalDuration: number;
      dailyDurations: Record<string, number>;
    }> = {};
    
    daily.forEach(dayData => {
      const weekStart = getWeekStartDate(dayData.date);
      
      if (!weeklyMap[weekStart]) {
        weeklyMap[weekStart] = {
          totalDuration: 0,
          dailyDurations: {}
        };
      }
      
      weeklyMap[weekStart].totalDuration += dayData.totalDuration;
      weeklyMap[weekStart].dailyDurations[dayData.date] = dayData.totalDuration;
    });
    
    const weekly: WeeklyStudyData[] = Object.keys(weeklyMap).map(weekStartDate => ({
      weekStartDate,
      totalDuration: weeklyMap[weekStartDate].totalDuration,
      dailyDurations: weeklyMap[weekStartDate].dailyDurations
    }));
    
    // Sort by week start date descending
    weekly.sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
    setWeeklyStudyData(weekly);
  };

  // Save completed study session to database via API
  const saveCompletedSession = async (completedSession: StudySession) => {
    if (!user) return;
    
    try {
      setIsLoadingSession(true);
      
      // Prepare payload for the API
      const payload = {
        userId: user.id,
        taskName: completedSession.taskName || "Unnamed Session",
        startTime: completedSession.startTime,
        endTime: completedSession.endTime,
        duration: completedSession.duration,
        date: completedSession.date
      };
      
      console.log('Saving completed session:', payload);
      
      // Create the session in the database
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to save study session');
      }
      
      // Update local state with the new session
      const updatedSessions = [...studySessions, completedSession];
      setStudySessions(updatedSessions);
      processStudyData(updatedSessions);
      
      // Update user's total study hours
      await updateUserStudyHours(updatedSessions);
      
      toast({
        title: "Session saved",
        description: "Your study session has been saved successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving study session:', error);
      toast({
        title: "Error saving session",
        description: "There was a problem saving your study session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Update user profile with total study hours via API
  const updateUserStudyHours = async (sessions: StudySession[]) => {
    if (!user) return;
    
    try {
      // Calculate total study hours from all completed sessions
      const totalSeconds = sessions.reduce((sum, session) => sum + session.duration, 0);
      const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));
      
      // Update user settings with study hours
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          studyHoursGoal: 35, // Default value
          studyHours: totalHours,
          theme: 'dark' // Default theme
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user study hours');
      }
      
    } catch (error) {
      console.error('Error updating user study hours:', error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your study hours. Your progress is still saved.",
        variant: "destructive"
      });
    }
  };

  // Start a new study session via API
  const startSession = async () => {
    if (!user) return;
    
    try {
      setIsLoadingSession(true);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const newSession: StudySession = {
        id: Date.now().toString(), // Temporary ID until we get one from the server
        taskName,
        subject: selectedSubject,
        startTime: now.toISOString(),
        endTime: null,
        duration: 0,
        date: today
      };
      
      // Prepare the payload according to the schema
      const payload = {
        userId: user.id,
        taskName: newSession.taskName || "Unnamed Session", // Ensure taskName is not empty
        subject: selectedSubject,
        startTime: newSession.startTime,
        endTime: null,
        duration: 0, // Required field, initialized as 0
        date: today
      };
      
      console.log('Starting study session:', payload);
      
      // Create the session in the database
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error('Study session error response:', errorData);
          throw new Error(`Failed to start study session: ${errorData.error || response.statusText}`);
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
          throw new Error(`Failed to start study session: ${response.status} ${response.statusText}`);
        }
      }
      
      // The created session from the server (with proper ID)
      const createdSession = await response.json();
      
      // Update UI state
      setActiveSession(createdSession);
      setElapsedTime(0);
      
      toast({
        title: "Session started",
        description: "Your study session has started. Don't forget to end it when you're done!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error starting study session:', error);
      toast({
        title: "Error starting session",
        description: "There was a problem starting your study session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  // End the current study session via API
  const endSession = async () => {
    if (!activeSession || !user) return;
    
    try {
      setIsLoadingSession(true);
      const now = new Date();
      const startTime = new Date(activeSession.startTime);
      const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      const completedSession: StudySession = {
        ...activeSession,
        endTime: now.toISOString(),
        duration: durationSeconds
      };
      
      // Update the session as completed in the database
      const response = await fetch(`/api/study-sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endTime: now.toISOString(),
          duration: durationSeconds
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to end study session');
      }
      
      // Update local state with completed session
      const updatedSessions = [...studySessions, completedSession];
      setStudySessions(updatedSessions);
      processStudyData(updatedSessions);
      
      // Update user's total study hours
      await updateUserStudyHours(updatedSessions);
      
      // Clear the active session
      setActiveSession(null);
      setElapsedTime(0);
      
      toast({
        title: "Session ended",
        description: `You studied for ${formatTime(durationSeconds)}. Great job!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error ending study session:', error);
      toast({
        title: "Error ending session",
        description: "There was a problem ending your study session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSession(false);
    }
  };
  
  // Save completed session with mood and energy via API
  const saveCompletedSession = async (session: StudySession) => {
    if (!user) return;
    
    try {
      // Add mood, energy and notes if provided
      const finalSession: StudySession = {
        ...session,
        mood: selectedMood,
        energy: selectedEnergy,
        notes: sessionNotes.trim() || undefined
      };
      
      // Prepare payload with all required fields
      const payload = {
        userId: user.id,
        taskName: finalSession.taskName || "Unnamed Session",
        startTime: finalSession.startTime,
        endTime: finalSession.endTime,
        duration: finalSession.duration,
        date: finalSession.date,
        // Optional fields with mood and energy from user selection
        mood: finalSession.mood || null,
        energy: finalSession.energy || null,
        notes: finalSession.notes || null
      };
      
      console.log('Saving session with mood/energy payload:', payload);
      
      // Create the session in the database
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to save study session');
      }
      
      // Update local state
      const updatedSessions = [...studySessions, finalSession];
      setStudySessions(updatedSessions);
      processStudyData(updatedSessions);
      
      // Update user's total study hours
      await updateUserStudyHours(updatedSessions);
      
      toast({
        title: "Session saved",
        description: "Your study session has been saved with mood and energy ratings.",
        variant: "default"
      });
      
      // Reset the dialog state
      setShowMoodEnergyDialog(false);
      setSessionToRate(null);
      setSelectedMood(undefined);
      setSelectedEnergy(undefined);
      setSessionNotes('');
    } catch (error) {
      console.error('Error saving study session:', error);
      toast({
        title: "Error saving session",
        description: "There was a problem saving your study session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Skip adding mood/energy and just save the session via API
  const skipMoodEnergyRating = async () => {
    if (!sessionToRate || !user) return;
    
    try {
      // Save the session without mood/energy/notes
      const payload = {
        userId: user.id,
        taskName: sessionToRate.taskName,
        startTime: sessionToRate.startTime,
        endTime: sessionToRate.endTime,
        duration: sessionToRate.duration,
        date: sessionToRate.date,
        // Adding explicit null values for optional fields
        mood: null,
        energy: null,
        notes: null
      };
      
      console.log('Saving completed session payload:', payload);
      
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to save study session');
      }
      
      // Update local state
      const updatedSessions = [...studySessions, sessionToRate];
      setStudySessions(updatedSessions);
      processStudyData(updatedSessions);
      
      // Update user's total study hours
      await updateUserStudyHours(updatedSessions);
      
      toast({
        title: "Session saved",
        description: "Your study session has been saved without ratings.",
        variant: "default"
      });
      
      // Reset the dialog state
      setShowMoodEnergyDialog(false);
      setSessionToRate(null);
      setSelectedMood(undefined);
      setSelectedEnergy(undefined);
      setSessionNotes('');
    } catch (error) {
      console.error('Error saving study session:', error);
      toast({
        title: "Error saving session",
        description: "There was a problem saving your study session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Edit session task name
  const editSession = (sessionId: string) => {
    const session = studySessions.find(s => s.id === sessionId);
    if (session) {
      setIsEditing(sessionId);
      setEditedTaskName(session.taskName);
      setEditedSubject(session.subject || 'General Study');
    }
  };

  // Save edited session task name and subject via API
  const saveEditedSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      const sessionToUpdate = studySessions.find(s => s.id === sessionId);
      if (!sessionToUpdate) return;
      
      // Update via API
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskName: editedTaskName.trim() || 'Unnamed Session',
          subject: editedSubject
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update study session');
      }
      
      // Update local state
      const updatedSessions = studySessions.map(session => {
        if (session.id === sessionId) {
          return { 
            ...session, 
            taskName: editedTaskName.trim() || 'Unnamed Session',
            subject: editedSubject
          };
        }
        return session;
      });
      
      setStudySessions(updatedSessions);
      setIsEditing(null);
      processStudyData(updatedSessions); // Update UI immediately
      
      toast({
        title: "Session updated",
        description: "Your study session has been updated successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating study session:', error);
      setIsEditing(null);
      toast({
        title: "Error updating session",
        description: "There was a problem updating your study session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Delete a study session via API
  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      // Delete from API
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete study session');
      }
      
      // Update local state
      const updatedSessions = studySessions.filter(session => session.id !== sessionId);
      setStudySessions(updatedSessions);
      processStudyData(updatedSessions); // Update UI immediately
      
      toast({
        title: "Session deleted",
        description: "Your study session has been deleted successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting study session:', error);
      toast({
        title: "Error deleting session",
        description: "There was a problem deleting your study session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Format date for display (e.g., "Monday, Jan 15, 2024")
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format week date range (e.g., "Jan 15 - Jan 21, 2024")
  const formatWeekRange = (weekStartStr: string): string => {
    const weekStart = new Date(weekStartStr);
    const weekEnd = new Date(weekStartStr);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${
      weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }`;
  };

  return (
    <Card className="shadow-lg border-t-4 border-t-green-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Study Hours Tracker</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Session Tracker */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-500" />
              <div className="text-lg font-bold">
                {activeSession ? formatTime(elapsedTime) : "00:00:00"}
              </div>
            </div>
            
            <div className="flex-1 mx-2 space-y-2">
              <Input
                placeholder="What are you studying?"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                disabled={!!activeSession}
                className="bg-slate-900 border-slate-700"
              />
              
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={!!activeSession}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue placeholder="Select a subject" />
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
            
            <div>
              {activeSession ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={endSession}
                  className="w-full md:w-auto"
                >
                  <Pause className="mr-1 h-4 w-4" />
                  End Session
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startSession}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                >
                  <Play className="mr-1 h-4 w-4" />
                  Start Session
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mood and Energy Dialog */}
        <Dialog open={showMoodEnergyDialog} onOpenChange={setShowMoodEnergyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rate your study session</DialogTitle>
              <DialogDescription>
                How did you feel during this study session? This helps track your productivity patterns.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Mood Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">How was your mood?</Label>
                <RadioGroup 
                  value={selectedMood} 
                  onValueChange={(value) => setSelectedMood(value as Mood)}
                  className="flex justify-between"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="terrible" id="mood-terrible" className="sr-only" />
                    <Label
                      htmlFor="mood-terrible"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedMood === 'terrible' ? 'bg-slate-700 text-red-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <Frown className="h-6 w-6 text-red-400" />
                      <span className="text-xs mt-1">Terrible</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="bad" id="mood-bad" className="sr-only" />
                    <Label
                      htmlFor="mood-bad"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedMood === 'bad' ? 'bg-slate-700 text-orange-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <Frown className="h-6 w-6 text-orange-400" />
                      <span className="text-xs mt-1">Bad</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="neutral" id="mood-neutral" className="sr-only" />
                    <Label
                      htmlFor="mood-neutral"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedMood === 'neutral' ? 'bg-slate-700 text-yellow-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <Meh className="h-6 w-6 text-yellow-400" />
                      <span className="text-xs mt-1">Neutral</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="good" id="mood-good" className="sr-only" />
                    <Label
                      htmlFor="mood-good"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedMood === 'good' ? 'bg-slate-700 text-blue-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <Smile className="h-6 w-6 text-blue-400" />
                      <span className="text-xs mt-1">Good</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="excellent" id="mood-excellent" className="sr-only" />
                    <Label
                      htmlFor="mood-excellent"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedMood === 'excellent' ? 'bg-slate-700 text-green-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <Smile className="h-6 w-6 text-green-400" />
                      <span className="text-xs mt-1">Excellent</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Energy Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">How was your energy level?</Label>
                <RadioGroup 
                  value={selectedEnergy} 
                  onValueChange={(value) => setSelectedEnergy(value as Energy)}
                  className="flex justify-between"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="exhausted" id="energy-exhausted" className="sr-only" />
                    <Label
                      htmlFor="energy-exhausted"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedEnergy === 'exhausted' ? 'bg-slate-700 text-red-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <BatteryLow className="h-6 w-6 text-red-400" />
                      <span className="text-xs mt-1">Exhausted</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="tired" id="energy-tired" className="sr-only" />
                    <Label
                      htmlFor="energy-tired"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedEnergy === 'tired' ? 'bg-slate-700 text-orange-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <BatteryLow className="h-6 w-6 text-orange-400" />
                      <span className="text-xs mt-1">Tired</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="normal" id="energy-normal" className="sr-only" />
                    <Label
                      htmlFor="energy-normal"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedEnergy === 'normal' ? 'bg-slate-700 text-yellow-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <BatteryMedium className="h-6 w-6 text-yellow-400" />
                      <span className="text-xs mt-1">Normal</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="energized" id="energy-energized" className="sr-only" />
                    <Label
                      htmlFor="energy-energized"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedEnergy === 'energized' ? 'bg-slate-700 text-blue-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <BatteryFull className="h-6 w-6 text-blue-400" />
                      <span className="text-xs mt-1">Energized</span>
                    </Label>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1">
                    <RadioGroupItem value="supercharged" id="energy-supercharged" className="sr-only" />
                    <Label
                      htmlFor="energy-supercharged"
                      className={`cursor-pointer flex flex-col items-center p-2 rounded-md ${
                        selectedEnergy === 'supercharged' ? 'bg-slate-700 text-green-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      <BatteryCharging className="h-6 w-6 text-green-400" />
                      <span className="text-xs mt-1">Supercharged</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Session Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any thoughts about this study session?"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="bg-slate-900 border-slate-700"
                />
              </div>
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button 
                variant="outline" 
                onClick={skipMoodEnergyRating}
              >
                Skip for now
              </Button>
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => sessionToRate && saveCompletedSession(sessionToRate)}
                disabled={!selectedMood || !selectedEnergy}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Sessions and Stats Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          {/* Today's Sessions */}
          <TabsContent value="today" className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Today's Study Sessions</h3>
            
            {dailyStudyData.length > 0 && dailyStudyData[0].date === new Date().toISOString().split('T')[0] ? (
              <div className="space-y-3">
                {dailyStudyData[0].sessions.map(session => (
                  <div key={session.id} className="p-3 bg-slate-800 rounded-md">
                    <div className="flex justify-between items-center">
                      {isEditing === session.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <Input
                            value={editedTaskName}
                            onChange={(e) => setEditedTaskName(e.target.value)}
                            className="bg-slate-900 border-slate-700"
                            autoFocus
                            placeholder="Session name"
                          />
                          
                          <Select
                            value={editedSubject}
                            onValueChange={setEditedSubject}
                          >
                            <SelectTrigger className="bg-slate-900 border-slate-700">
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {jeeSubjects.map((subject) => (
                                <SelectItem key={subject} value={subject}>
                                  {subject}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex justify-end gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => saveEditedSession(session.id)}
                            >
                              <Save className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setIsEditing(null)}
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="font-medium">{session.taskName}</div>
                            <div className="flex items-center text-xs text-gray-400 space-x-2">
                              <span>
                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </span>
                              
                              {session.subject && (
                                <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded-full text-xs">
                                  {session.subject}
                                </span>
                              )}
                              
                              {session.mood && (
                                <span className={`flex items-center px-1.5 py-0.5 rounded-full text-xs ${
                                  session.mood === 'terrible' ? 'bg-red-900/30 text-red-400' :
                                  session.mood === 'bad' ? 'bg-orange-900/30 text-orange-400' :
                                  session.mood === 'neutral' ? 'bg-yellow-900/30 text-yellow-400' :
                                  session.mood === 'good' ? 'bg-blue-900/30 text-blue-400' :
                                  'bg-green-900/30 text-green-400'
                                }`}>
                                  {session.mood === 'terrible' || session.mood === 'bad' ? 
                                    <Frown className="h-3 w-3 mr-1" /> : 
                                    session.mood === 'neutral' ? 
                                    <Meh className="h-3 w-3 mr-1" /> : 
                                    <Smile className="h-3 w-3 mr-1" />
                                  }
                                  {session.mood.charAt(0).toUpperCase() + session.mood.slice(1)}
                                </span>
                              )}
                              
                              {session.energy && (
                                <span className={`flex items-center px-1.5 py-0.5 rounded-full text-xs ${
                                  session.energy === 'exhausted' ? 'bg-red-900/30 text-red-400' :
                                  session.energy === 'tired' ? 'bg-orange-900/30 text-orange-400' :
                                  session.energy === 'normal' ? 'bg-yellow-900/30 text-yellow-400' :
                                  session.energy === 'energized' ? 'bg-blue-900/30 text-blue-400' :
                                  'bg-green-900/30 text-green-400'
                                }`}>
                                  {session.energy === 'exhausted' || session.energy === 'tired' ? 
                                    <BatteryLow className="h-3 w-3 mr-1" /> : 
                                    session.energy === 'normal' ? 
                                    <BatteryMedium className="h-3 w-3 mr-1" /> : 
                                    session.energy === 'energized' ? 
                                    <BatteryFull className="h-3 w-3 mr-1" /> :
                                    <BatteryCharging className="h-3 w-3 mr-1" />
                                  }
                                  {session.energy.charAt(0).toUpperCase() + session.energy.slice(1)}
                                </span>
                              )}
                            </div>
                            
                            {session.notes && (
                              <div className="text-xs text-gray-400 mt-1 italic">
                                "{session.notes}"
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <div className="font-bold text-green-400 mr-3">
                              {formatHours(session.duration)} hrs
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => editSession(session.id)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => deleteSession(session.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center p-3 bg-green-900/30 rounded-md mt-4">
                  <div className="font-medium">Total Study Time Today</div>
                  <div className="font-bold text-green-400">{formatHours(dailyStudyData[0].totalDuration)} hrs</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No study sessions recorded today
              </div>
            )}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 max-h-[400px] overflow-y-auto">
            {dailyStudyData.length > 0 ? (
              dailyStudyData.map(day => (
                <div key={day.date} className="mb-6">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-300">{formatDate(day.date)}</h3>
                    <div className="ml-auto font-bold text-green-400">{formatHours(day.totalDuration)} hrs</div>
                  </div>
                  
                  <div className="space-y-2">
                    {day.sessions.map(session => (
                      <div key={session.id} className="p-3 bg-slate-800 rounded-md">
                        <div className="flex justify-between items-center">
                          {isEditing === session.id ? (
                            <div className="flex-1 flex items-center">
                              <Input
                                value={editedTaskName}
                                onChange={(e) => setEditedTaskName(e.target.value)}
                                className="bg-slate-900 border-slate-700 mr-2"
                                autoFocus
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => saveEditedSession(session.id)}
                                className="h-8 w-8"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => setIsEditing(null)}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="font-medium">{session.taskName}</div>
                                <div className="flex items-center text-xs text-gray-400 space-x-2">
                                  <span>
                                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                    {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                  </span>
                                  
                                  {session.mood && (
                                    <span className={`flex items-center px-1.5 py-0.5 rounded-full text-xs ${
                                      session.mood === 'terrible' ? 'bg-red-900/30 text-red-400' :
                                      session.mood === 'bad' ? 'bg-orange-900/30 text-orange-400' :
                                      session.mood === 'neutral' ? 'bg-yellow-900/30 text-yellow-400' :
                                      session.mood === 'good' ? 'bg-blue-900/30 text-blue-400' :
                                      'bg-green-900/30 text-green-400'
                                    }`}>
                                      {session.mood === 'terrible' || session.mood === 'bad' ? 
                                        <Frown className="h-3 w-3 mr-1" /> : 
                                        session.mood === 'neutral' ? 
                                        <Meh className="h-3 w-3 mr-1" /> : 
                                        <Smile className="h-3 w-3 mr-1" />
                                      }
                                      {session.mood.charAt(0).toUpperCase() + session.mood.slice(1)}
                                    </span>
                                  )}
                                  
                                  {session.energy && (
                                    <span className={`flex items-center px-1.5 py-0.5 rounded-full text-xs ${
                                      session.energy === 'exhausted' ? 'bg-red-900/30 text-red-400' :
                                      session.energy === 'tired' ? 'bg-orange-900/30 text-orange-400' :
                                      session.energy === 'normal' ? 'bg-yellow-900/30 text-yellow-400' :
                                      session.energy === 'energized' ? 'bg-blue-900/30 text-blue-400' :
                                      'bg-green-900/30 text-green-400'
                                    }`}>
                                      {session.energy === 'exhausted' || session.energy === 'tired' ? 
                                        <BatteryLow className="h-3 w-3 mr-1" /> : 
                                        session.energy === 'normal' ? 
                                        <BatteryMedium className="h-3 w-3 mr-1" /> : 
                                        session.energy === 'energized' ? 
                                        <BatteryFull className="h-3 w-3 mr-1" /> :
                                        <BatteryCharging className="h-3 w-3 mr-1" />
                                      }
                                      {session.energy.charAt(0).toUpperCase() + session.energy.slice(1)}
                                    </span>
                                  )}
                                </div>
                                
                                {session.notes && (
                                  <div className="text-xs text-gray-400 mt-1 italic">
                                    "{session.notes}"
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center">
                                <div className="font-bold text-green-400 mr-3">
                                  {formatHours(session.duration)} hrs
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => editSession(session.id)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => deleteSession(session.id)}
                                  className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                No study history recorded
              </div>
            )}
          </TabsContent>
          
          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Weekly Study Stats</h3>
            
            {weeklyStudyData.length > 0 ? (
              <div className="space-y-4">
                {weeklyStudyData.map(week => (
                  <div key={week.weekStartDate} className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{formatWeekRange(week.weekStartDate)}</h4>
                      <div className="font-bold text-green-400">{formatHours(week.totalDuration)} hrs</div>
                    </div>
                    
                    <div className="w-full bg-gray-700 h-2 rounded-full">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (week.totalDuration / (35 * 3600)) * 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-right mt-1 text-gray-400">
                      Goal: 35 hours per week
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mt-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        // Calculate date for this day
                        const date = new Date(week.weekStartDate);
                        date.setDate(date.getDate() + index);
                        const dateStr = date.toISOString().split('T')[0];
                        
                        // Get duration for this day
                        const duration = week.dailyDurations[dateStr] || 0;
                        const hours = duration / 3600;
                        
                        // Calculate height based on hours (max 5 hours)
                        const heightPercentage = Math.min(100, (hours / 5) * 100);
                        
                        return (
                          <div key={day} className="flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">{day}</div>
                            <div className="w-full bg-slate-700 rounded-sm relative" style={{ height: '60px' }}>
                              <div 
                                className="bg-green-600 absolute bottom-0 left-0 w-full rounded-sm"
                                style={{ height: `${heightPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs mt-1">
                              {hours > 0 ? hours.toFixed(1) : '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No study stats available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}