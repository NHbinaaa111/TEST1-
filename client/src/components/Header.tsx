import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Header({ showBackButton = false, onBack }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Handle click outside dropdown
  const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#user-menu-button') && !target.closest('#user-dropdown')) {
      closeDropdown();
    }
  };

  // Add event listener
  useState(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });

  return (
    <header className="bg-[#1A1A1A] shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            {showBackButton ? (
              <button 
                id="back-to-dashboard" 
                className="p-2 rounded-md hover:bg-[#252525] transition-all duration-300"
                onClick={() => {
                  if (onBack) onBack();
                  else navigate('/dashboard');
                }}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            ) : (
              <Link href={user ? '/dashboard' : '/'}>
                <h1 className="text-2xl font-poppins font-bold cursor-pointer">
                  <span className="neon-text-blue">Chad</span>
                  <span className="neon-text-green">jee</span>
                </h1>
              </Link>
            )}
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="relative" id="notification-container">
                <button className="p-2 rounded-full hover:bg-[#252525] transition-all duration-300">
                  <i className="fas fa-bell text-[#E0E0E0]"></i>
                </button>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#39FF14] animate-pulse-neon"></span>
              </div>
              
              <div className="relative" id="user-menu-container">
                <button 
                  id="user-menu-button" 
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[#252525] transition-all duration-300"
                  onClick={toggleDropdown}
                >
                  <span id="user-name" className="text-sm font-medium hidden sm:inline">{user.name}</span>
                  <div className="h-8 w-8 rounded-full bg-[#00EEFF] flex items-center justify-center text-[#121212] font-medium">
                    <span id="user-initial">{getInitials(user.name)}</span>
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div 
                    id="user-dropdown" 
                    className="absolute right-0 mt-2 w-48 bg-[#252525] rounded-md shadow-lg z-50 border border-[#1E1E1E]"
                  >
                    <div className="py-1">
                      <Link href="/settings">
                        <a className="block px-4 py-2 text-sm hover:bg-[#1E1E1E] transition-all duration-300">Settings</a>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-[#BF40FF] hover:bg-[#1E1E1E] transition-all duration-300"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <nav>
              <div className="flex gap-4">
                <Link href="/auth">
                  <button className="px-5 py-2 rounded-md bg-transparent border border-[#00EEFF] hover:shadow-neon-blue transition-all duration-300 text-[#00EEFF]">
                    Login / Sign Up
                  </button>
                </Link>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
