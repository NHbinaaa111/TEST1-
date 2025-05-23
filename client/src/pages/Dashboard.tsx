import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl, getDefaultFetchOptions } from '@/lib/api-config';
import {
  getUserSubjects,
  getUserCalendarTasks,
  updateTask,
  addTask
} from '@/lib/storage';
import { 
  getTodayString 
} from '@/lib/utils';
import { Task, CalendarTask, Subject } from '@/lib/types';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import QuoteCard from '@/components/QuoteCard';
import TaskList from '@/components/TaskList';
import Calendar from '@/components/Calendar';
import SubjectProgress from '@/components/SubjectProgress';
import PomodoroTimer from '@/components/PomodoroTimer';
import JEECountdown from '@/components/JEECountdown';
import SimplifiedStudyTracker from '@/components/SimplifiedStudyTracker';
import StudyStreakBadge from '@/components/StudyStreakBadge';
import StudyRecommendations from '@/components/StudyRecommendations';
import SyllabusProgressTracker from '@/components/SyllabusProgressTracker';
import NotesSection from '@/components/NotesSection';
import TestRecordSection from '@/components/TestRecordSection';
import PageTransition from '@/components/PageTransition';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // User data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  
  // Orb explosion animation state
  const [orbClickCount, setOrbClickCount] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const orbRef = useRef<HTMLButtonElement>(null);
  
  // Dialog states
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    subjectColor: 'blue'
  });
  
  // Load user data from API using React Query
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['/api/users', user?.id, 'subjects'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/subjects`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching subjects:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/users', user?.id, 'tasks'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/tasks`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ['/api/users', user?.id, 'settings'],
    queryFn: async () => {
      if (!user) return null;
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/settings`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
      }
    },
    enabled: !!user,
  });

  const { data: calendarData, isLoading: loadingCalendar } = useQuery({
    queryKey: ['/api/users', user?.id, 'calendar-tasks'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/calendar-tasks`),
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching calendar tasks:", error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // FIXED: Add query for study sessions to calculate weekly study hours
  const { data: studySessionsData, isLoading: loadingStudySessions } = useQuery({
    queryKey: ['/api/users', user?.id, 'study-sessions'],
    queryFn: async () => {
      if (!user) return [];
      try {
        const userId = String(user.id);
        const response = await fetch(
          getApiUrl(`/api/users/${userId}/study-sessions`), 
          getDefaultFetchOptions()
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Error fetching study sessions:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Update state with fetched data or fallbacks
  useEffect(() => {
    if (!user) {
      setLocation('/login');
      return;
    }

    if (subjectsData) {
      setSubjects(subjectsData);
    }
    
    // Set calendar tasks
    if (calendarData) {
      setCalendarTasks(calendarData);
    }
    
  }, [user, setLocation, subjectsData, calendarData]);
  
  // Handle task completion toggle
  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      // Convert user.id to string
      const userId = String(user.id);
      
      // Update task status
      updateTask(userId, taskId, { completed });
      
      // Dispatch task-updated event for any component that might be listening
      const taskUpdatedEvent = new CustomEvent('task-updated', { 
        detail: { userId, timestamp: Date.now() } 
      });
      window.dispatchEvent(taskUpdatedEvent);
      
      toast({
        title: completed ? "Task completed" : "Task marked as incomplete",
        description: "Your task has been updated",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Could not update task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle add task dialog
  const openAddTaskDialog = () => {
    setNewTask({
      title: '',
      subject: 'Physics',
      subjectColor: 'blue'
    });
    setIsAddTaskDialogOpen(true);
  };
  
  const handleAddTask = () => {
    if (!user) return;
    
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Convert user.id to string
      const userId = String(user.id);
      
      // Make sure the title is always a string
      const taskTitle = newTask.title.trim();
      
      const task: Omit<Task, 'id'> = {
        title: taskTitle,
        completed: false,
        date: getTodayString(),
        subject: newTask.subject,
        subjectColor: newTask.subject === 'Physics' ? 'blue' : 
                     newTask.subject === 'Chemistry' ? 'green' : 'purple'
      };
      
      // Add task
      addTask(userId, task);
      
      // Dispatch task-updated event for any components that might be listening
      const taskUpdatedEvent = new CustomEvent('task-updated', { 
        detail: { userId, timestamp: Date.now() } 
      });
      window.dispatchEvent(taskUpdatedEvent);
      
      // Close dialog
      setIsAddTaskDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Could not add task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex">
        <Sidebar />
        
        <div className="flex-grow overflow-auto p-6 pb-20 md:pb-6">
          <div className="container mx-auto">
            {/* Dashboard Header */}
            <PageTransition className="w-full">
              <div className="mb-8">
                <h2 className="text-2xl font-poppins font-semibold">
                  Welcome back, <span className="neon-text-blue">{user?.name.split(' ')[0]}</span>!
                </h2>
                <p className="text-[#E0E0E0] opacity-80">Here's an overview of your JEE preparation journey.</p>
              </div>
            </PageTransition>
            
            {/* Welcome Banner */}
            <PageTransition className="w-full">
              <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-[#080824] via-[#171750] to-[#1A1A3A] border border-[rgba(255,255,255,0.08)]">
                {/* Enhanced background with dot pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgY3g9IjEwIiBjeT0iMTAiIHI9IjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
                
                {/* Enhanced background gradients */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-transparent to-[rgba(94,23,235,0.4)] opacity-80"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-[rgba(0,255,184,0.4)] via-transparent to-transparent opacity-80 blur-lg"></div>
                
                {/* Improved glow effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#5E17EB] rounded-full filter blur-[120px] opacity-25"></div>
                <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#5E17EB] rounded-full filter blur-[80px] opacity-25"></div>
                <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-[#00FFB8] rounded-full filter blur-[100px] opacity-20"></div>
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-6 md:mb-0">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                      Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] font-extrabold">{user?.name?.split(' ')[0] || 'Student'}</span>!
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80">
                      Let's crush your JEE goals.
                    </p>
                  </div>
                  
                  {/* Interactive orb with explosion animation on third click */}
                  <div className="flex justify-center">
                    {isExploding ? (
                      // Exploding orb fragments container
                      <div className="relative w-24 h-24 md:w-32 md:h-32">
                        {/* Explosion ring effect */}
                        <div className="absolute inset-0 rounded-full border-2 border-white opacity-80 animate-explosion-ring"></div>
                        <div className="absolute inset-0 rounded-full border border-[#00FFB8] opacity-60 animate-explosion-ring" style={{animationDelay: '0.1s'}}></div>
                        
                        {/* 6 fragments that explode outward */}
                        <div className="absolute inset-0 w-full h-full">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-60 animate-fragment-1"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-60 animate-fragment-2"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-60 animate-fragment-3"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-60 animate-fragment-4"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-60 animate-fragment-5"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-60 animate-fragment-6"></div>
                          
                          {/* Central flash */}
                          <div className="absolute inset-0 rounded-full bg-white opacity-100 animate-pulse"></div>
                        </div>
                      </div>
                    ) : (
                      // Normal orb with click animation
                      <button 
                        ref={orbRef}
                        className="relative w-24 h-24 md:w-32 md:h-32 focus:outline-none cursor-pointer transition-all duration-300 animate-float"
                        onClick={(e) => {
                          // Orb explosion logic here
                          const newClickCount = orbClickCount + 1;
                          setOrbClickCount(newClickCount);
                          
                          // Normal click animation for clicks 1 and 2
                          if (newClickCount < 3) {
                            // Get the button element
                            const button = e.currentTarget;
                            
                            // Add animation classes
                            button.classList.add('animate-orb-click');
                            
                            // Add glow effect
                            const glow = button.querySelector('.orb-glow');
                            if (glow) {
                              glow.classList.add('animate-glow-burst');
                            }
                            
                            // Add ripple effect
                            const ripple = document.createElement('div');
                            ripple.className = 'absolute inset-0 rounded-full bg-white opacity-30 scale-0 animate-ripple';
                            button.appendChild(ripple);
                            
                            // Reset after animation completes
                            setTimeout(() => {
                              button.classList.remove('animate-orb-click');
                              if (glow) {
                                glow.classList.remove('animate-glow-burst');
                              }
                              if (ripple && ripple.parentNode === button) {
                                button.removeChild(ripple);
                              }
                            }, 1000);
                          } 
                          // Explosion animation on third click
                          else {
                            setIsExploding(true);
                            
                            // Reset after animation completes
                            setTimeout(() => {
                              setIsExploding(false);
                              setOrbClickCount(0);
                            }, 2000);
                          }
                        }}
                        aria-label="Activate energy orb"
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-20 animate-pulse"></div>
                        <div className="orb-glow absolute inset-2 rounded-full bg-gradient-to-r from-[#00FFB8] to-[#5E17EB] opacity-40 blur-md"></div>
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-center h-full z-10">
                          <i className="fas fa-lightbulb text-5xl text-white"></i>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </PageTransition>
            
            {/* Progress by Subject */}
            <PageTransition className="w-full">
              <div className="mb-8">
                {/* Subject Progress */}
                <SubjectProgress subjects={subjects} />
              </div>
            </PageTransition>
            
            {/* New Dashboard Tabs */}
            <PageTransition className="w-full">
              <div className="mt-8">
                <Tabs defaultValue="study-tools" className="w-full">
                  <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-4">
                    <TabsTrigger value="study-tools">Study Tools</TabsTrigger>
                    <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="calendar" className="hidden lg:block">Calendar</TabsTrigger>
                    <TabsTrigger value="quote" className="hidden lg:block">Quote</TabsTrigger>
                  </TabsList>
                  
                  {/* Study Tools Tab */}
                  <TabsContent value="study-tools" className="space-y-6">
                    {/* Study Streak Badge */}
                    <StudyStreakBadge />
                    
                    {/* Study Recommendations with JEE Dashboard Link */}
                    <div className="flex flex-col">
                      <StudyRecommendations />
                      <div className="flex justify-end mt-2">
                        <Link to="/jee-dashboard">
                          <Button variant="outline" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition-colors">
                            View JEE Dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PomodoroTimer />
                      <JEECountdown />
                    </div>
                    <SimplifiedStudyTracker />
                  </TabsContent>
                  
                  {/* Syllabus Tab */}
                  <TabsContent value="syllabus">
                    <SyllabusProgressTracker />
                  </TabsContent>
                  
                  {/* Notes Tab */}
                  <TabsContent value="notes">
                    <NotesSection />
                  </TabsContent>
                  
                  {/* Calendar Tab */}
                  <TabsContent value="calendar">
                    <Calendar calendarTasks={calendarTasks} />
                  </TabsContent>
                  
                  {/* Quote Tab */}
                  <TabsContent value="quote">
                    <QuoteCard />
                  </TabsContent>
                </Tabs>
              </div>
            </PageTransition>
          </div>
        </div>
      </main>
      
      <MobileNav />
      
      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--card-foreground)]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium">Task Title</label>
              <Input 
                id="task-title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-[var(--secondary)] border-[var(--border)]"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="task-subject" className="text-sm font-medium">Subject</label>
              <Select
                value={newTask.subject}
                onValueChange={(value) => setNewTask({ ...newTask, subject: value })}
              >
                <SelectTrigger className="bg-[var(--secondary)] border-[var(--border)]">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="Physics" className="text-[var(--neon-blue)]">Physics</SelectItem>
                  <SelectItem value="Chemistry" className="text-[var(--neon-green)]">Chemistry</SelectItem>
                  <SelectItem value="Mathematics" className="text-[var(--neon-purple)]">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsAddTaskDialogOpen(false)}
              className="border-[var(--border)] hover:bg-[var(--secondary)]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTask}
              className="bg-[var(--neon-purple)] text-white hover:bg-[var(--neon-purple)] hover:bg-opacity-90"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}