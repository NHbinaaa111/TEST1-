import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { calculateStreak, wouldDeleteResetStreak } from '@/utils/streak-tracker';
import { useToast } from './use-toast';

export interface StudySession {
  id: number;
  userId: number;
  taskName: string;
  subject?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  date: string;
  notes?: string;
  mood?: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent';
  energy?: 'exhausted' | 'tired' | 'normal' | 'energized' | 'supercharged';
}

export function useStudySessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // Fetch all study sessions for the user
  const fetchSessions = useCallback(async () => {
    if (!user?.id) {
      setSessions([]);
      setActiveSession(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user.id}/study-sessions`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch study sessions');
      }

      const data = await response.json();
      setSessions(data);

      // Check for active session
      try {
        const activeResponse = await fetch(`/api/users/${user.id}/active-study-session`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (activeResponse.ok) {
          const activeData = await activeResponse.json();
          setActiveSession(activeData);
        } else {
          // No active session or other error
          setActiveSession(null);
        }
      } catch (err) {
        console.error('Error fetching active session:', err);
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch study sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new study session
  const createSession = async (sessionData: Omit<StudySession, 'id' | 'userId'>) => {
    if (!user?.id) return null;

    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create study session');
      }

      const newSession = await response.json();
      setSessions(prev => [...prev, newSession]);
      setActiveSession(newSession);
      return newSession;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create study session');
      return null;
    }
  };

  // Update an existing study session
  const updateSession = async (sessionId: number, sessionData: Partial<StudySession>) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to update study session');
      }

      const updatedSession = await response.json();
      
      // Update sessions list
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));
      
      // Update active session if this was the active one
      if (activeSession && activeSession.id === sessionId) {
        if (updatedSession.endTime) {
          // Session was completed, no longer active
          setActiveSession(null);
        } else {
          setActiveSession(updatedSession);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to update study session');
      return false;
    }
  };

  // Check if deleting a session would reset the streak
  const checkStreakResetOnDelete = (sessionId: number): boolean => {
    const sessionToDelete = sessions.find(session => session.id === sessionId);
    if (!sessionToDelete) return false;
    
    return wouldDeleteResetStreak(sessions, sessionToDelete);
  };

  // Delete a study session
  const deleteSession = async (sessionId: number, skipConfirmation = false) => {
    if (!user?.id) return false;
    
    // Find the session to delete
    const sessionToDelete = sessions.find(session => session.id === sessionId);
    if (!sessionToDelete) {
      setError('Session not found');
      return false;
    }
    
    // Check if this would reset the streak
    const wouldResetStreak = wouldDeleteResetStreak(sessions, sessionToDelete);
    
    // If it would reset streak and confirmation not skipped, confirm with user
    if (wouldResetStreak && !skipConfirmation) {
      const confirmed = window.confirm(
        "Deleting this session will reset your streak. Are you sure you want to continue?"
      );
      
      if (!confirmed) {
        return false;
      }
    }

    try {
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete study session');
      }

      // Update sessions list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Clear active session if this was the active one
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null);
      }
      
      // If this reset the streak, show a notification
      if (wouldResetStreak) {
        toast({
          title: "Streak Reset",
          description: "Your study streak has been reset.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Study session deleted successfully.",
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete study session');
      toast({
        title: "Error",
        description: "Failed to delete study session.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Calculate streak when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      const currentStreak = calculateStreak(sessions);
      setStreak(currentStreak);
    } else {
      setStreak(0);
    }
  }, [sessions]);

  // Load sessions on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    }
  }, [fetchSessions, user]);

  return {
    sessions,
    activeSession,
    loading,
    error,
    streak,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    checkStreakResetOnDelete,
  };
}
