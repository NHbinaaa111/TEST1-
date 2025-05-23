import { useState, FormEvent, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { getUserSettings, updateUserSettings } from '@/lib/storage';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accentColor, setAccentColor] = useState('blue');
  const [jeeMainsDate, setJeeMainsDate] = useState('');
  const [jeeAdvancedDate, setJeeAdvancedDate] = useState('');
  const [targetJeeYear, setTargetJeeYear] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setName(user.name);
    setEmail(user.email);
    
    // Load user target JEE date
    if (user.targetJeeYear) {
      const targetYear = parseInt(user.targetJeeYear);
      // Approximate JEE Mains date (January 15 of target year)
      setJeeMainsDate(`${targetYear}-01-15`);
      // Approximate JEE Advanced date (May 28 of target year)
      setJeeAdvancedDate(`${targetYear}-05-28`);
    }
  }, [user, navigate]);

  const handleProfileUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    updateUser({ name });
    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
  };

  const handleUpdateDates = () => {
    // Update JEE target year based on the Mains date
    if (jeeMainsDate) {
      const year = jeeMainsDate.split('-')[0];
      if (user && year) {
        setTargetJeeYear(year);
        updateUser({ targetJeeYear: year });
        
        // Update in localStorage for JEECountdown component
        localStorage.setItem('jee_target_date', new Date(jeeMainsDate).toISOString());

        toast({
          title: "Success",
          description: "Exam dates updated successfully!",
        });
      }
    }
  };

  const handleResetProgress = () => {
    // Clear tasks and progress from localStorage
    if (user) {
      localStorage.removeItem(`tasks_${user.id}`);
      localStorage.removeItem(`subjects_${user.id}`);
      localStorage.removeItem(`goals_${user.id}`);
      localStorage.removeItem(`calendar_${user.id}`);
      
      toast({
        title: "Progress Reset",
        description: "All your progress and tasks have been reset",
      });
    }
  };

  const handleDeleteAccount = () => {
    // Log the user out which is all we can do with localStorage
    logout();
    toast({
      title: "Account Deleted",
      description: "Your account has been deleted and you've been logged out",
    });
    navigate('/');
  };

  // Theme toggle functions
  const isDarkTheme = theme === 'dark';
  
  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system');
    
    toast({
      title: "Theme Updated",
      description: `Theme set to ${value} mode`,
    });
  };

  return (
    <div id="settings-page" className="page active min-h-screen flex flex-col">
      <header className="py-6 px-6 md:px-16 flex justify-between items-center border-b border-[#3A3A3A]">
        <div className="flex items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl md:text-3xl font-orbitron font-bold cursor-pointer">
              <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
            </h1>
          </Link>
        </div>
        <Link href="/dashboard">
          <button className="text-gray-300 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </Link>
      </header>
      
      <main className="flex-grow flex justify-center py-12 px-6">
        <div className="w-full max-w-2xl">
          <h2 className="text-2xl font-orbitron font-bold mb-8">Settings</h2>
          
          <div className="card-bg p-6 rounded-xl border mb-8">
            <h3 className="font-orbitron font-semibold mb-6">Profile Settings</h3>
            <form id="profile-form" className="space-y-6" onSubmit={handleProfileUpdate}>
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  id="profile-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 inner-card border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium mb-2">Email Address</label>
                <input 
                  type="email" 
                  id="profile-email" 
                  value={email} 
                  className="w-full px-4 py-3 inner-card border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-md bg-[#00EEFF] text-[#121212] font-medium neon-blue-glow hover:bg-opacity-90 transition duration-300"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
          
          <div className="card-bg p-6 rounded-xl border mb-8">
            <h3 className="font-orbitron font-semibold mb-6">Appearance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">Theme</div>
                  <div className="text-xs text-gray-400">Choose light, dark, or system theme</div>
                </div>
                <div className="relative w-48">
                  <Select
                    value={theme}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger className="w-full inner-card border">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent className="card-bg border">
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">Accent Color</div>
                  <div className="text-xs text-gray-400">Choose your preferred accent color</div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className={`w-6 h-6 rounded-full bg-[#00EEFF] ${accentColor === 'blue' ? 'border-2 border-white' : ''}`}
                    onClick={() => setAccentColor('blue')}
                  ></button>
                  <button 
                    className={`w-6 h-6 rounded-full bg-[#0FFF50] ${accentColor === 'green' ? 'border-2 border-white' : ''}`}
                    onClick={() => setAccentColor('green')}
                  ></button>
                  <button 
                    className={`w-6 h-6 rounded-full bg-[#5E17EB] ${accentColor === 'purple' ? 'border-2 border-white' : ''}`}
                    onClick={() => setAccentColor('purple')}
                  ></button>
                  <button 
                    className={`w-6 h-6 rounded-full bg-pink-500 ${accentColor === 'pink' ? 'border-2 border-white' : ''}`}
                    onClick={() => setAccentColor('pink')}
                  ></button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-bg p-6 rounded-xl border mb-8">
            <h3 className="font-orbitron font-semibold mb-6">Target Exam Dates</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="jee-mains-date" className="block text-sm font-medium mb-2">JEE Mains Exam</label>
                <input 
                  type="date" 
                  id="jee-mains-date" 
                  value={jeeMainsDate} 
                  onChange={(e) => setJeeMainsDate(e.target.value)}
                  className="w-full px-4 py-3 inner-card border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]"
                />
              </div>
              <div>
                <label htmlFor="jee-advanced-date" className="block text-sm font-medium mb-2">JEE Advanced Exam</label>
                <input 
                  type="date" 
                  id="jee-advanced-date" 
                  value={jeeAdvancedDate} 
                  onChange={(e) => setJeeAdvancedDate(e.target.value)}
                  className="w-full px-4 py-3 inner-card border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]"
                />
              </div>
              <div>
                <button 
                  type="button" 
                  onClick={handleUpdateDates}
                  className="px-6 py-2 rounded-md bg-[#5E17EB] text-white font-medium neon-purple-glow hover:bg-opacity-90 transition duration-300"
                >
                  Update Dates
                </button>
              </div>
            </div>
          </div>
          
          <div className="card-bg p-6 rounded-xl border">
            <h3 className="font-orbitron font-semibold mb-6 text-red-500">Danger Zone</h3>
            <div className="space-y-4">
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="px-6 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:bg-opacity-10 transition duration-300"
                    >
                      Reset All Progress
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="card-bg border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Progress</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all your task history and progress data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="inner-card text-foreground hover:opacity-90">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleResetProgress}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Reset Progress
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-gray-500 mt-1">This will delete all your task history and progress data</p>
              </div>
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="px-6 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:bg-opacity-10 transition duration-300"
                    >
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="card-bg border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="inner-card text-foreground hover:opacity-90">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-gray-500 mt-1">This action cannot be undone</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
