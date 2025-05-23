import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/Dashboard/Sidebar';
import MobileMenu from '@/components/Dashboard/MobileMenu';
import TaskManager from '@/components/Dashboard/TaskManager';
import StudyPlanner from '@/components/Dashboard/StudyPlanner';
import Calendar from '@/components/Dashboard/Calendar';
import Goals from '@/components/Dashboard/Goals';
import Progress from '@/components/Dashboard/Progress';
import { useToast } from '@/hooks/use-toast';
import { TaskService } from '@/services/TaskService';
import { ProgressService } from '@/services/ProgressService';
import { QuoteService } from '@/services/QuoteService';
import { useDashboardContext } from '@/hooks/use-dashboard-context';

type DashboardView = 'dashboard-home' | 'dashboard-tasks' | 'dashboard-planner' | 'dashboard-calendar' | 'dashboard-goals' | 'dashboard-progress';

function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard-home');
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>({
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    overall: 0
  });
  const [currentQuote, setCurrentQuote] = useState<{text: string, author: string}>({ text: '', author: '' });
  
  // Use dashboard context for real-time widget updates
  const { 
    overallProgress,
    tasksRatio,
    weeklyStudyHours,
    updateOverallProgress,
    updateTasksRatio,
    updateWeeklyStudyHours
  } = useDashboardContext();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load tasks
    const tasks = TaskService.getTodaysTasks();
    setTodaysTasks(tasks);

    // Update task ratio for real-time widget
    const completed_count = TaskService.getCompletedTasksCount();
    const total_count = tasks.length;
    updateTasksRatio(completed_count, total_count);

    // Load progress
    const progressData = ProgressService.getProgress();
    setProgress(progressData);
    
    // Update overall progress for real-time widget
    updateOverallProgress(progressData.overall);

    // Set current quote
    setCurrentQuote(QuoteService.getCurrentQuote());
    
    // Set up interval for updating widgets
    const interval = setInterval(() => {
      // Refresh tasks count (for real-time updates)
      const currentTasks = TaskService.getTodaysTasks();
      if (JSON.stringify(currentTasks) !== JSON.stringify(todaysTasks)) {
        setTodaysTasks(currentTasks);
        const completed = TaskService.getCompletedTasksCount();
        updateTasksRatio(completed, currentTasks.length);
      }
      
      // Refresh progress data
      const currentProgress = ProgressService.getProgress();
      if (JSON.stringify(currentProgress) !== JSON.stringify(progress)) {
        setProgress(currentProgress);
        updateOverallProgress(currentProgress.overall);
      }
    }, 5000); // Update every 5 seconds
    
    // Add custom event listeners for widget updates
    const handleSyllabusUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.overall === 'number') {
        setProgress((prev: any) => ({
          ...prev,
          overall: customEvent.detail.overall,
          physics: customEvent.detail.physics || prev.physics,
          chemistry: customEvent.detail.chemistry || prev.chemistry,
          mathematics: customEvent.detail.mathematics || prev.mathematics
        }));
      }
    };
    
    // Listen for study session updates
    const handleStudySessionUpdate = (event: Event) => {
      // When a new study session is added/updated, recalculate weekly hours
      const studySessions = JSON.parse(localStorage.getItem('chadjee_study_sessions') || '[]');
      
      // Calculate study hours from the last 7 days
      const now = new Date();
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 7);
      
      let totalMinutes = 0;
      studySessions.forEach((session: any) => {
        if (!session) return;
        
        const sessionDate = new Date(session.date || session.startTime);
        if (sessionDate >= lastWeekStart) {
          if (session.duration) {
            totalMinutes += session.duration / 60; // Convert seconds to minutes
          } else if (session.startTime && session.endTime) {
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
          }
        }
      });
      
      // Convert to hours with 1 decimal place
      const hours = Math.round(totalMinutes / 6) / 10;
      updateWeeklyStudyHours(hours);
    };
    
    // Add event listeners
    window.addEventListener('subject-progress-updated', handleSyllabusUpdate as EventListener);
    window.addEventListener('study-session-updated', handleStudySessionUpdate as EventListener);
    
    // Clean up on component unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener('subject-progress-updated', handleSyllabusUpdate as EventListener);
      window.removeEventListener('study-session-updated', handleStudySessionUpdate as EventListener);
    };
  }, [isAuthenticated, navigate, updateTasksRatio, updateOverallProgress, updateWeeklyStudyHours, progress, todaysTasks]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const switchDashboardView = (view: DashboardView) => {
    setCurrentView(view);
  };

  const handleNextQuote = () => {
    const quote = QuoteService.getNextQuote();
    setCurrentQuote(quote);
  };

  const completeTask = (taskId: string, completed: boolean) => {
    TaskService.updateTaskStatus(taskId, completed);
    const updatedTasks = TaskService.getTodaysTasks();
    setTodaysTasks(updatedTasks);
    
    // Update progress as well
    const progressData = ProgressService.getProgress();
    setProgress(progressData);
    
    // Update the task ratio for real-time widget updates
    const completed_count = TaskService.getCompletedTasksCount();
    const total_count = TaskService.getTodaysTasks().length;
    updateTasksRatio(completed_count, total_count);
    
    // Trigger a custom event to notify other components
    const event = new CustomEvent('task-updated');
    window.dispatchEvent(event);
    
    toast({
      title: completed ? "Task completed" : "Task marked as incomplete",
      description: "Your progress has been updated",
    });
  };

  return (
    <div id="dashboard-page" className="page active min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar 
        currentView={currentView} 
        switchView={switchDashboardView} 
        userName={user?.name || ""}
      />
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-[#3A3A3A]">
        <div className="flex items-center">
          <h1 className="text-xl font-orbitron font-bold">
            <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
          </h1>
        </div>
        <button className="text-gray-300 p-2" onClick={toggleMobileMenu}>
          <i className="fas fa-bars"></i>
        </button>
      </header>
      
      {/* Mobile Menu (off-canvas) */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={toggleMobileMenu} 
        currentView={currentView} 
        switchView={(view) => {
          switchDashboardView(view);
          toggleMobileMenu();
        }}
        userName={user?.name || ""}
      />
      
      {/* Dashboard Content */}
      <div className="flex-grow overflow-y-auto">
        {/* Dashboard Home View */}
        {currentView === 'dashboard-home' && (
          <div id="dashboard-home" className="dashboard-view active p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-orbitron font-bold mb-2">
                Welcome back, <span id="user-name" className="text-[#00EEFF]">{user?.name}</span>
              </h2>
              <p className="text-gray-400">Here's your study overview for today</p>
            </div>
            
            {/* Countdown & Quote - Redesigned with modern dark style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 dashboard-panel dashboard-panel-purple">
                <h3 className="font-bold text-xl text-white mb-5 flex items-center">
                  <i className="fas fa-hourglass-half mr-3 text-[var(--neon-cyan)]"></i>
                  <span className="neon-text-cyan">Exam Countdown</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#1A1A1A] backdrop-blur-md border border-[var(--neon-cyan)]/10 rounded-xl p-5 shadow-neon-blue">
                    <div className="text-xs text-white/60 mb-3 font-medium">JEE Mains 2024</div>
                    <div className="flex items-baseline">
                      <div className="text-5xl font-bold text-[var(--neon-cyan)] glow-cyan">
                        {TaskService.getDaysUntilJEEMains()}
                      </div>
                      <div className="ml-3 text-white/70">days remaining</div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <div className="flex-1 bg-[#252525] rounded-lg p-3 text-center">
                        <div className="text-xs text-white/60 mb-1">Hours</div>
                        <div className="font-bold text-xl text-[var(--neon-cyan)]">
                          {TaskService.getHoursUntilJEEMains()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#252525] rounded-lg p-3 text-center">
                        <div className="text-xs text-white/60 mb-1">Minutes</div>
                        <div className="font-bold text-xl text-[var(--neon-cyan)]">
                          {TaskService.getMinutesUntilJEEMains()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#252525] rounded-lg p-3 text-center">
                        <div className="text-xs text-white/60 mb-1">Seconds</div>
                        <div className="font-bold text-xl text-[var(--neon-cyan)]" id="jee-mains-seconds">
                          {TaskService.getSecondsUntilJEEMains()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A] backdrop-blur-md border border-[var(--neon-purple)]/10 rounded-xl p-5 shadow-neon-purple">
                    <div className="text-xs text-white/60 mb-3 font-medium">JEE Advanced 2024</div>
                    <div className="flex items-baseline">
                      <div className="text-5xl font-bold text-[var(--neon-purple)] glow-purple">
                        {TaskService.getDaysUntilJEEAdvanced()}
                      </div>
                      <div className="ml-3 text-white/70">days remaining</div>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <div className="flex-1 bg-[#252525] rounded-lg p-3 text-center">
                        <div className="text-xs text-white/60 mb-1">Hours</div>
                        <div className="font-bold text-xl text-[var(--neon-purple)]">
                          {TaskService.getHoursUntilJEEAdvanced()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#252525] rounded-lg p-3 text-center">
                        <div className="text-xs text-white/60 mb-1">Minutes</div>
                        <div className="font-bold text-xl text-[var(--neon-purple)]">
                          {TaskService.getMinutesUntilJEEAdvanced()}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#252525] rounded-lg p-3 text-center">
                        <div className="text-xs text-white/60 mb-1">Seconds</div>
                        <div className="font-bold text-xl text-[var(--neon-purple)]" id="jee-advanced-seconds">
                          {TaskService.getSecondsUntilJEEAdvanced()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dashboard-panel dashboard-panel-green flex flex-col">
                <h3 className="font-bold text-xl text-white mb-4 flex items-center">
                  <i className="fas fa-lightbulb mr-3 text-[var(--neon-green)]"></i>
                  <span className="neon-text-green">Daily Motivation</span>
                </h3>
                <div className="flex-grow flex items-center bg-[#1A1A1A] rounded-xl p-5 border border-[var(--neon-green)]/10 shadow-neon-green">
                  <div id="quote-container" className="text-center w-full">
                    <p className="italic text-white/90 mb-4 text-lg">"{currentQuote.text}"</p>
                    <p className="text-sm text-[var(--neon-green)] font-medium">- {currentQuote.author}</p>
                  </div>
                </div>
                <button 
                  id="next-quote" 
                  className="mt-5 btn-neon btn-neon-green hover:text-white rounded-lg px-5 py-2.5 self-end"
                  onClick={handleNextQuote}
                >
                  Next Quote <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
            
            {/* Tasks & Activity - Redesigned with modern dark style */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="dashboard-panel dashboard-panel-blue">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-xl text-white flex items-center">
                    <i className="fas fa-tasks mr-3 text-[var(--neon-cyan)]"></i>
                    <span className="neon-text-cyan">Today's Tasks</span>
                  </h3>
                  <button 
                    className="btn-neon text-sm px-4 py-1.5 rounded-lg" 
                    onClick={() => switchDashboardView('dashboard-tasks')}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {todaysTasks.length > 0 ? todaysTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="task-item flex items-center p-4 bg-[#1A1A1A] backdrop-blur-md rounded-xl border border-[rgba(255,255,255,0.05)] hover:border-[var(--neon-cyan)]/30 transition-all duration-300 shadow-md">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={(e) => completeTask(task.id, e.target.checked)}
                        className="form-checkbox h-5 w-5 text-[var(--neon-green)] rounded-md border-[#3A3A3A] bg-[#252525] mr-4"
                      />
                      <div className="flex-grow">
                        <div className={`text-sm font-medium ${task.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-white/50 mt-1.5">
                          {task.startTime} - {task.endTime}
                        </div>
                      </div>
                      <div className={`text-xs px-3.5 py-1.5 rounded-full ${
                        task.subject === 'physics' ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 
                        task.subject === 'chemistry' ? 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]' : 
                        task.subject === 'mathematics' ? 'bg-[var(--neon-pink)]/10 text-[var(--neon-pink)]' : 
                        'bg-white/10 text-white/70'
                      }`}>
                        {task.subject.charAt(0).toUpperCase() + task.subject.slice(1)}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-white/60 bg-[#1A1A1A]/80 rounded-xl border border-[rgba(255,255,255,0.03)]">
                      <i className="fas fa-clipboard-list text-3xl mb-3 text-[var(--neon-cyan)]/40"></i>
                      <p>No tasks for today. Add some tasks to get started!</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="dashboard-panel dashboard-panel-purple">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-xl text-white flex items-center">
                    <i className="fas fa-chart-line mr-3 text-[var(--neon-pink)]"></i>
                    <span className="neon-text-pink">Subject Progress</span>
                  </h3>
                  <button 
                    className="btn-neon btn-neon-purple text-sm px-4 py-1.5 rounded-lg"
                    onClick={() => switchDashboardView('dashboard-progress')}
                  >
                    View Details
                  </button>
                </div>
                <div className="space-y-6 mt-4">
                  {/* Subject progress bars with modern dark styling */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-white/90 flex items-center">
                        <div className="w-3 h-3 bg-[var(--neon-green)] rounded-full mr-2 shadow-neon-green"></div>
                        Physics
                      </div>
                      <div className="text-sm font-medium text-[var(--neon-green)] glow-green">{progress.physics}%</div>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-green" 
                        style={{width: `${progress.physics}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-white/90 flex items-center">
                        <div className="w-3 h-3 bg-[var(--neon-cyan)] rounded-full mr-2 shadow-neon-cyan"></div>
                        Chemistry
                      </div>
                      <div className="text-sm font-medium text-[var(--neon-cyan)] glow-cyan">{progress.chemistry}%</div>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-blue" 
                        style={{width: `${progress.chemistry}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-white/90 flex items-center">
                        <div className="w-3 h-3 bg-[var(--neon-pink)] rounded-full mr-2 shadow-neon-pink"></div>
                        Mathematics
                      </div>
                      <div className="text-sm font-medium text-[var(--neon-pink)] glow-pink">{progress.mathematics}%</div>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-pink" 
                        style={{width: `${progress.mathematics}%`}}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-white/90 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-[var(--neon-green)] via-[var(--neon-cyan)] to-[var(--neon-pink)] rounded-full mr-2 shadow-neon-purple"></div>
                        Overall Syllabus
                      </div>
                      <div className="text-sm font-medium text-white glow-purple">{progress.overall}%</div>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-purple" 
                        style={{width: `${progress.overall}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Manager View */}
        {currentView === 'dashboard-tasks' && (
          <TaskManager />
        )}
        
        {/* Study Planner View */}
        {currentView === 'dashboard-planner' && (
          <StudyPlanner />
        )}
        
        {/* Calendar View */}
        {currentView === 'dashboard-calendar' && (
          <Calendar />
        )}
        
        {/* Goals View */}
        {currentView === 'dashboard-goals' && (
          <Goals />
        )}
        
        {/* Progress View */}
        {currentView === 'dashboard-progress' && (
          <Progress />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
