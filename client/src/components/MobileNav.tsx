import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { 
      name: 'Home', 
      path: '/dashboard', 
      icon: 'fas fa-home' 
    },
    { 
      name: 'JEE', 
      path: '/jee-dashboard', 
      icon: 'fas fa-atom' 
    },
    { 
      name: 'Study', 
      path: '/planner', 
      icon: 'fas fa-book' 
    },
    { 
      name: 'Tasks', 
      path: '/tasks', 
      icon: 'fas fa-tasks' 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: 'fas fa-cog' 
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A] flex justify-around py-3 border-t border-[#1E1E1E] z-10">
      {navItems.map((item) => (
        <Link href={item.path} key={item.path}>
          <a className={cn(
            "p-2 flex flex-col items-center text-xs",
            isActive(item.path) 
              ? item.path === '/settings' 
                ? "text-[#BF40FF]" 
                : "text-[#00EEFF]" 
              : "text-[#E0E0E0] opacity-70 hover:opacity-100 transition-all duration-300"
          )}>
            <i className={cn(item.icon, "text-lg mb-1")}></i>
            <span>{item.name}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
}
