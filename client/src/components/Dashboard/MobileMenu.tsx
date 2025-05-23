import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TaskService } from '@/services/TaskService';

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  switchView: (view: any) => void;
  userName: string;
};

const MobileMenu = ({ isOpen, onClose, currentView, switchView, userName }: MobileMenuProps) => {
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
      onClose();
    }
  };

  return (
    <div 
      id="mobile-menu" 
      className={`fixed inset-0 bg-[#121212] z-50 transform transition-transform duration-300 md:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-[#3A3A3A]">
          <h2 className="font-orbitron font-bold">Menu</h2>
          <button className="text-gray-300 p-2" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-1">
          <a 
            href="#" 
            className={`mobile-nav-item flex items-center px-4 py-3 rounded-md ${
              currentView === 'dashboard-home' 
                ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
                : 'text-gray-300 hover:bg-[#3A3A3A]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              switchView('dashboard-home');
            }}
          >
            <i className="fas fa-home w-5 h-5 mr-3"></i>
            <span>Dashboard</span>
          </a>
          
          <a 
            href="#" 
            className={`mobile-nav-item flex items-center px-4 py-3 rounded-md ${
              currentView === 'dashboard-tasks' 
                ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
                : 'text-gray-300 hover:bg-[#3A3A3A]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              switchView('dashboard-tasks');
            }}
          >
            <i className="fas fa-tasks w-5 h-5 mr-3"></i>
            <span>Tasks</span>
          </a>
          
          <a 
            href="#" 
            className={`mobile-nav-item flex items-center px-4 py-3 rounded-md ${
              currentView === 'dashboard-planner' 
                ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
                : 'text-gray-300 hover:bg-[#3A3A3A]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              switchView('dashboard-planner');
            }}
          >
            <i className="fas fa-book w-5 h-5 mr-3"></i>
            <span>Study Planner</span>
          </a>
          
          <a 
            href="#" 
            className={`mobile-nav-item flex items-center px-4 py-3 rounded-md ${
              currentView === 'dashboard-calendar' 
                ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
                : 'text-gray-300 hover:bg-[#3A3A3A]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              switchView('dashboard-calendar');
            }}
          >
            <i className="fas fa-calendar-alt w-5 h-5 mr-3"></i>
            <span>Calendar</span>
          </a>
          
          <a 
            href="#" 
            className={`mobile-nav-item flex items-center px-4 py-3 rounded-md ${
              currentView === 'dashboard-goals' 
                ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
                : 'text-gray-300 hover:bg-[#3A3A3A]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              switchView('dashboard-goals');
            }}
          >
            <i className="fas fa-bullseye w-5 h-5 mr-3"></i>
            <span>Goals</span>
          </a>
          
          <a 
            href="#" 
            className={`mobile-nav-item flex items-center px-4 py-3 rounded-md ${
              currentView === 'dashboard-progress' 
                ? 'text-[#00EEFF] bg-[#00EEFF] bg-opacity-10' 
                : 'text-gray-300 hover:bg-[#3A3A3A]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              switchView('dashboard-progress');
            }}
          >
            <i className="fas fa-chart-line w-5 h-5 mr-3"></i>
            <span>Progress</span>
          </a>
        </nav>
        <div className="p-4 border-t border-[#3A3A3A]">
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase font-medium mb-2">JEE Mains Countdown</div>
            <div className="font-rajdhani font-bold text-2xl text-[#00EEFF]">
              {daysUntilJEEMains} Days
            </div>
          </div>
          <div className="flex flex-col">
            <Link href="/settings">
              <a className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#3A3A3A] rounded-md" onClick={onClose}>
                <i className="fas fa-cog w-5 h-5 mr-3"></i>
                <span>Settings</span>
              </a>
            </Link>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#3A3A3A] rounded-md"
            >
              <i className="fas fa-sign-out-alt w-5 h-5 mr-3"></i>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
