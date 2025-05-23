import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import StreakTracker from '@/components/StreakTracker';
import StudyMilestoneBadges from '@/components/StudyMilestoneBadges';
import { getApiUrl, getDefaultFetchOptions } from '@/lib/api-config';
import { apiRequest } from '@/lib/queryClient';
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

export default function SimplifiedStudyTracker() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { playSessionStartSound, playSessionEndSound } = useSoundEffects();
  
  // Session state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [taskName, setTaskName] = useState('Studying');
  const [selectedSubject, setSelectedSubject] = useState('General Study');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editedTaskName, setEditedTaskName] = useState('');
  
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
      // Convert user.id to string to ensure compatibility
      const userId = String(user.id);
      
      // Fetch study sessions using standardized fetch options
      const response = await fetch(
        getApiUrl(`/api/users/${userId}/study-sessions`), 
        getDefaultFetchOptions()
      );
      
      if (!response.ok) {
        console.error('Failed to load study sessions:', response.status, response.statusText);
        throw new Error('Failed to load study sessions');
      }
      
      const loadedSessions = await response.json();
      setStudySessions(Array.isArray(loadedSessions) ? loadedSessions : []);
      
      // Check if there's an active session using standardized fetch options
      const activeSessionResponse = await fetch(
        getApiUrl(`/api/users/${userId}/active-study-session`), 
        getDefaultFetchOptions()
      );
      
      if (activeSessionResponse.ok) {
        const loadedActiveSession = await activeSessionResponse.json();
        if (loadedActiveSession) {
          try {
            // Ensure startTime is a valid date string
            const startTimeStr = loadedActiveSession.startTime;
            const startTime = new Date(startTimeStr);
            
            // Validate the date object is valid
            if (!isNaN(startTime.getTime())) {
              setActiveSession(loadedActiveSession);
              setTaskName(loadedActiveSession.taskName || '');
              
              // Calculate elapsed time
              const now = new Date();
              const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
              setElapsedTime(Math.max(0, elapsedSeconds)); // Ensure non-negative
            } else {
              console.error('Invalid start time in active session:', startTimeStr);
              setActiveSession(null);
            }
          } catch (dateError) {
            console.error('Error processing active session date:', dateError);
            setActiveSession(null);
          }
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

  // Update user profile with total study hours via API
  const updateUserStudyHours = async (sessions: StudySession[]) => {
    if (!user) return;
    
    try {
      // Convert user.id to string
      const userId = String(user.id);
      
      // Calculate total study hours from all completed sessions
      const totalSeconds = sessions.reduce((sum, session) => sum + session.duration, 0);
      const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));
      
      // Update user settings with study hours using our reusable API request function
      const response = await apiRequest('POST', '/api/user-settings', {
        userId: userId,
        studyHoursGoal: 35, // Default value
        studyHours: totalHours,
        theme: 'dark' // Default theme
      });
      
      // Emit an event for the dashboard weekly study hours widget to update
      const studySessionUpdatedEvent = new CustomEvent('study-session-updated', {
        detail: { userId, totalHours, timestamp: Date.now() }
      });
      window.dispatchEvent(studySessionUpdatedEvent);
      
      if (!response.ok) {
        console.error('Failed to update user study hours:', response.status, response.statusText);
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
      
      // Important: Convert user.id to number
      const userId = parseInt(user.id.toString());
      
      if (isNaN(userId)) {
        throw new Error("Invalid user ID");
      }
      
      const sanitizedTaskName = taskName.trim() || "Unnamed Session";
      
      // Prepare the payload according to the schema - ensuring all types are correct
      const payload = {
        userId: userId, // Ensuring this is a number, not a string
        taskName: sanitizedTaskName,
        subject: selectedSubject || "General Study", // Include the selected subject
        startTime: now.toISOString(),
        endTime: null,
        duration: 0,
        date: today
      };
      
      console.log('Starting study session with payload:', payload);
      
      // Create the session in the database using our standardized API request
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to start study session: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('Study session error response:', errorData);
          if (errorData.error) {
            errorMessage = `Failed to start study session: ${errorData.error}`;
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // The created session from the server (with proper ID)
      const createdSession = await response.json();
      
      // Update UI state
      setActiveSession(createdSession);
      setElapsedTime(0);
      
      // Update the local study sessions list
      setStudySessions(prev => [...prev, createdSession]);
      
      // Play start sound
      playSessionStartSound();
      
      toast({
        title: "Session started",
        description: "Your study session has started. Don't forget to end it when you're done!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error starting study session:', error);
      toast({
        title: "Error starting session",
        description: error instanceof Error ? error.message : "There was a problem starting your study session. Please try again.",
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
      
      console.log('Ending study session:', activeSession.id, 'with duration:', durationSeconds);
      
      // Update the session as completed in the database
      const response = await fetch(getApiUrl(`/api/study-sessions/${activeSession.id}`), {
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
        let errorMessage = `Failed to end study session: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('End session error response:', errorData);
          if (errorData.error) {
            errorMessage = `Failed to end study session: ${errorData.error}`;
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      // Get the updated session from server
      const updatedSession = await response.json();
      
      // Update local state correctly - replace the active session with the completed one
      const updatedSessions = studySessions.map(s => 
        s.id === activeSession.id ? updatedSession : s
      );
      
      setStudySessions(updatedSessions);
      processStudyData(updatedSessions);
      
      // Update user's total study hours
      await updateUserStudyHours(updatedSessions);
      
      // Clear the active session
      setActiveSession(null);
      setElapsedTime(0);
      
      // Play end sound
      playSessionEndSound();
      
      toast({
        title: "Session ended",
        description: `You studied for ${formatTime(durationSeconds)}. Great job!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error ending study session:', error);
      toast({
        title: "Error ending session",
        description: error instanceof Error ? error.message : "There was a problem ending your study session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Edit session task name
  const editSession = (sessionId: string) => {
    const session = studySessions.find(s => s.id === sessionId);
    if (session) {
      setIsEditing(sessionId);
      setEditedTaskName(session.taskName);
    }
  };

  // Save edited session task name via API
  const saveEditedSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      const sessionToUpdate = studySessions.find(s => s.id === sessionId);
      if (!sessionToUpdate) return;
      
      // Update via API
      const response = await fetch(getApiUrl(`/api/study-sessions/${sessionId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskName: editedTaskName.trim() || 'Unnamed Session'
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update study session');
      }
      
      // Update local state
      const updatedSessions = studySessions.map(session => {
        if (session.id === sessionId) {
          return { ...session, taskName: editedTaskName.trim() || 'Unnamed Session' };
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
      const response = await fetch(getApiUrl(`/api/study-sessions/${sessionId}`), {
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
              
              {/* JEE Subject Selector */}
              <div className="flex items-center">
                <Label htmlFor="subject" className="mr-2 text-sm text-gray-400">Subject:</Label>
                <select
                  id="subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!!activeSession}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm w-full"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="General Study">General Study</option>
                </select>
              </div>
            </div>
            
            <div>
              {activeSession ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={endSession}
                  className="w-full md:w-auto"
                  disabled={isLoadingSession}
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
                  disabled={isLoadingSession}
                >
                  <Play className="mr-1 h-4 w-4" />
                  Start Session
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Session Data Tabs */}
        <Tabs defaultValue="today" className="mt-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="today" className="text-sm">Today</TabsTrigger>
            <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
            <TabsTrigger value="stats" className="text-sm">Stats</TabsTrigger>
          </TabsList>
          
          {/* Today Tab */}
          <TabsContent value="today" className="mt-0">
            {isLoading ? (
              <div className="text-center py-8">Loading today's sessions...</div>
            ) : dailyStudyData.length > 0 && dailyStudyData[0]?.date === new Date().toISOString().split('T')[0] ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{formatDate(dailyStudyData[0].date)}</h3>
                  <div className="text-sm text-right">
                    <span className="text-green-500 font-semibold">
                      {formatHours(dailyStudyData[0].totalDuration)}
                    </span> hours
                  </div>
                </div>
                
                <div className="space-y-2">
                  {dailyStudyData[0].sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="bg-slate-800 p-3 rounded-md flex justify-between items-center"
                    >
                      <div className="flex-1">
                        {isEditing === session.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editedTaskName}
                              onChange={(e) => setEditedTaskName(e.target.value)}
                              className="h-8 py-1 bg-slate-700"
                              placeholder="Session name"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => saveEditedSession(session.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setIsEditing(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-between w-full">
                            <span>{session.taskName}</span>
                            <div className="text-sm text-gray-400 flex gap-3 items-center">
                              <span>{formatTime(session.duration)}</span>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => editSession(session.id)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => deleteSession(session.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {dailyStudyData[0].sessions.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No sessions recorded today. Start a study session to track your progress!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No study sessions recorded today. Start a session to begin tracking your progress!
              </div>
            )}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            {isLoading ? (
              <div className="text-center py-8">Loading study history...</div>
            ) : dailyStudyData.length > 0 ? (
              <div className="space-y-6">
                {dailyStudyData.map(dayData => (
                  <div key={dayData.date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{formatDate(dayData.date)}</h3>
                      <div className="text-sm">
                        <span className="text-green-500 font-semibold">
                          {formatHours(dayData.totalDuration)}
                        </span> hours
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {dayData.sessions.map(session => (
                        <div 
                          key={session.id} 
                          className="bg-slate-800 p-3 rounded-md"
                        >
                          <div className="flex justify-between items-center">
                            <span>{session.taskName}</span>
                            <span className="text-sm text-gray-400">{formatTime(session.duration)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No study history available. Start tracking your progress!
              </div>
            )}
          </TabsContent>
          
          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-0">
            {isLoading ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : weeklyStudyData.length > 0 ? (
              <div className="space-y-6">
                {/* Streak and Badges Section */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3 justify-center">
                    <StreakTracker studySessions={studySessions} />
                  </div>
                  <div className="flex flex-wrap justify-center">
                    <StudyMilestoneBadges studySessions={studySessions} />
                  </div>
                </div>
                
                {weeklyStudyData.map(weekData => (
                  <div key={weekData.weekStartDate} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Week of {formatWeekRange(weekData.weekStartDate)}</h3>
                      <div className="text-sm">
                        <span className="text-green-500 font-semibold">
                          {formatHours(weekData.totalDuration)}
                        </span> hours
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 p-3 rounded-md">
                      <div className="grid grid-cols-7 gap-1 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                          const date = new Date(weekData.weekStartDate);
                          date.setDate(date.getDate() + index);
                          const dateKey = date.toISOString().split('T')[0];
                          const dayDuration = weekData.dailyDurations[dateKey] || 0;
                          const height = Math.max(4, (dayDuration / 3600) * 10); // Scale height based on hours (min 4px)
                          
                          return (
                            <div key={day} className="flex flex-col items-center">
                              <div className="text-xs text-gray-500 mb-1">{day}</div>
                              <motion.div 
                                className="w-full bg-green-900 rounded-t-sm" 
                                initial={{ height: 0 }}
                                animate={{ height: `${height}px` }}
                                transition={{ duration: 0.7, delay: index * 0.1 }}
                              />
                              <div className="text-xs mt-1 text-gray-500">
                                {formatHours(dayDuration)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Total Study Time</h3>
                    <span className="text-lg text-green-500 font-bold">
                      {formatHours(studySessions.reduce((sum, session) => sum + session.duration, 0))}h
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No statistics available yet. Start studying to see your progress!
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}