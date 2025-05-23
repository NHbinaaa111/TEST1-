import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ConfettiProvider } from "./hooks/use-confetti-context";
import { PomodoroProvider } from "./hooks/use-pomodoro-context";
import { StreakProvider } from "./hooks/use-streak-context";
import { DashboardProvider } from "./hooks/use-dashboard-context";
import { queryClient } from "./lib/queryClient";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Home from "./pages/Home";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";
// New page imports
import PlannerPage from "./pages/PlannerPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import ProgressPage from "./pages/ProgressPage";
import GoalsPage from "./pages/GoalsPage";
import LearnMorePage from "./pages/LearnMorePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import JEEDashboardPage from "./pages/JEEDashboardPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/learn-more" component={LearnMorePage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/planner" component={PlannerPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/progress" component={ProgressPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/jee-dashboard" component={JEEDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const App = () => {
  // JEE-specific subject data for study recommendations
  // This would ideally come from the database based on actual sessions
  const subjectData = {
    'Mathematics': { lastStudied: new Date('2024-05-03').toISOString(), frequency: 5, dailyTimes: {} },
    'Physics': { lastStudied: new Date('2024-05-01').toISOString(), frequency: 3, dailyTimes: {} },
    'Chemistry': { lastStudied: new Date('2024-04-28').toISOString(), frequency: 2, dailyTimes: {} }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ConfettiProvider>
            <PomodoroProvider>
              <StreakProvider subjectData={subjectData}>
                <DashboardProvider>
                  <Toaster />
                  <Router />
                </DashboardProvider>
              </StreakProvider>
            </PomodoroProvider>
          </ConfettiProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
