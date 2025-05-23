import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const { logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: 'fas fa-home' 
    },
    { 
      name: 'JEE Dashboard', 
      path: '/jee-dashboard', 
      icon: 'fas fa-atom' 
    },
    { 
      name: 'Study Planner', 
      path: '/planner', 
      icon: 'fas fa-book' 
    },
    { 
      name: 'Tasks', 
      path: '/tasks', 
      icon: 'fas fa-tasks' 
    },
    { 
      name: 'Calendar', 
      path: '/calendar', 
      icon: 'fas fa-calendar' 
    },
    { 
      name: 'Progress', 
      path: '/progress', 
      icon: 'fas fa-chart-line' 
    },
    { 
      name: 'Goals', 
      path: '/goals', 
      icon: 'fas fa-flag' 
    }
  ];

  return (
    <aside className="hidden md:block w-64 bg-[#1A1A1A] border-r border-[#1E1E1E]">
      <nav className="flex flex-col h-full p-4">
        <div className="space-y-2 flex-grow">
          {navItems.map((item) => (
            <Link href={item.path} key={item.path}>
              <a className={cn(
                "nav-link flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300",
                isActive(item.path) 
                  ? "bg-[#252525] text-[#00EEFF]" 
                  : "hover:bg-[#252525]"
              )}>
                <i className={cn(item.icon, "w-5 text-center")}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
        </div>
        
        <div className="border-t border-[#1E1E1E] pt-4 mt-4">
          <Link href="/settings">
            <a className={cn(
              "nav-link flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300",
              isActive('/settings') 
                ? "bg-[#252525] text-[#BF40FF]" 
                : "hover:bg-[#252525]"
            )}>
              <i className="fas fa-cog w-5 text-center"></i>
              <span>Settings</span>
            </a>
          </Link>
          <button 
            onClick={handleLogout}
            className="nav-link w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-[#252525] transition-all duration-300 text-[#BF40FF]"
          >
            <i className="fas fa-sign-out-alt w-5 text-center"></i>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
