import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TaskService } from '@/services/TaskService';

type SidebarProps = {
  currentView: string;
  switchView: (view: any) => void;
  userName: string;
};

const Sidebar = ({ currentView, switchView, userName }: SidebarProps) => {
  const [, navigate] = useLocation();
  const [daysUntilJEEMains, setDaysUntilJEEMains] = useState(0);
  
  useEffect(() => {
    const updateCountdown = () => {
      setDaysUntilJEEMains(TaskService.getDaysUntilJEEMains());
    };
    
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const logout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      // Perform logout
      navigate('/login');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#171717] border-r border-[#2A2A2A] p-6 shadow-lg relative overflow-hidden">
      {/* Subtle gradient overlay for the sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(204,255,0,0.03)] via-[rgba(0,255,184,0.02)] to-[rgba(191,64,255,0.03)] pointer-events-none"></div>
      
      {/* Logo area */}
      <div className="flex items-center mb-8 relative z-10">
        <Link href="/dashboard">
          <h1 className="text-2xl font-poppins font-bold cursor-pointer">
            <span className="text-[#00FFB8] glow-blue">Chad</span><span className="text-[#CCFF00] glow-green">jee</span>
          </h1>
        </Link>
      </div>
      
      {/* Navigation items */}
      <nav className="flex-grow space-y-1 relative z-10">
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
            currentView === 'dashboard-home' 
              ? 'text-[#00FFB8] bg-[#00FFB8] bg-opacity-10 shadow-[0_0_15px_rgba(0,255,184,0.2)]' 
              : 'text-gray-300 hover:bg-[#252525] hover:transform hover:translate-x-1'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-home');
          }}
        >
          <i className="fas fa-home w-5 h-5 mr-3"></i>
          <span className="font-medium">Dashboard</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
            currentView === 'dashboard-tasks' 
              ? 'text-[#CCFF00] bg-[#CCFF00] bg-opacity-10 shadow-[0_0_15px_rgba(204,255,0,0.2)]' 
              : 'text-gray-300 hover:bg-[#252525] hover:transform hover:translate-x-1'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-tasks');
          }}
        >
          <i className="fas fa-tasks w-5 h-5 mr-3"></i>
          <span className="font-medium">Tasks</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
            currentView === 'dashboard-planner' 
              ? 'text-[#BF40FF] bg-[#BF40FF] bg-opacity-10 shadow-[0_0_15px_rgba(191,64,255,0.2)]' 
              : 'text-gray-300 hover:bg-[#252525] hover:transform hover:translate-x-1'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-planner');
          }}
        >
          <i className="fas fa-book w-5 h-5 mr-3"></i>
          <span className="font-medium">Study Planner</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
            currentView === 'dashboard-calendar' 
              ? 'text-[#FF4FCB] bg-[#FF4FCB] bg-opacity-10 shadow-[0_0_15px_rgba(255,79,203,0.2)]' 
              : 'text-gray-300 hover:bg-[#252525] hover:transform hover:translate-x-1'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-calendar');
          }}
        >
          <i className="fas fa-calendar-alt w-5 h-5 mr-3"></i>
          <span className="font-medium">Calendar</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
            currentView === 'dashboard-goals' 
              ? 'text-[#66CCFF] bg-[#66CCFF] bg-opacity-10 shadow-[0_0_15px_rgba(102,204,255,0.2)]' 
              : 'text-gray-300 hover:bg-[#252525] hover:transform hover:translate-x-1'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-goals');
          }}
        >
          <i className="fas fa-bullseye w-5 h-5 mr-3"></i>
          <span className="font-medium">Goals</span>
        </a>
        
        <a 
          href="#" 
          className={`dashboard-nav-item flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${
            currentView === 'dashboard-progress' 
              ? 'text-[#FFB830] bg-[#FFB830] bg-opacity-10 shadow-[0_0_15px_rgba(255,184,48,0.2)]' 
              : 'text-gray-300 hover:bg-[#252525] hover:transform hover:translate-x-1'
          }`}
          onClick={(e) => {
            e.preventDefault();
            switchView('dashboard-progress');
          }}
        >
          <i className="fas fa-chart-line w-5 h-5 mr-3"></i>
          <span className="font-medium">Progress</span>
        </a>
      </nav>
      
      {/* Footer area */}
      <div className="pt-6 border-t border-[#2A2A2A] relative z-10">
        {/* JEE Countdown card */}
        <div className="mb-6 p-4 bg-[#1E1E1E] rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-[#333] relative overflow-hidden">
          {/* Subtle gradient border */}
          <div className="absolute inset-0 border border-[rgba(0,255,184,0.2)] rounded-lg opacity-50"></div>
          
          <div className="text-xs text-gray-400 uppercase font-medium mb-2 tracking-wider">JEE Mains Countdown</div>
          <div className="font-poppins font-bold text-2xl text-[#00FFB8] glow-blue">
            {daysUntilJEEMains} Days
          </div>
        </div>
        
        {/* Settings and logout */}
        <div className="flex flex-col space-y-1">
          <Link href="/settings">
            <a className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#252525] rounded-lg transition-all duration-300 hover:transform hover:translate-x-1">
              <i className="fas fa-cog w-5 h-5 mr-3"></i>
              <span className="font-medium">Settings</span>
            </a>
          </Link>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#252525] rounded-lg transition-all duration-300 hover:transform hover:translate-x-1"
          >
            <i className="fas fa-sign-out-alt w-5 h-5 mr-3"></i>
            <span className="font-medium">Logout</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
