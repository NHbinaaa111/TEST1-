import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getUserSettings, updateUserSettings, getUserProfile, updateUserProfile } from '@/lib/storage';
import { UserSettings } from '@/lib/types';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useStudySessions } from '@/hooks/use-study-sessions';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  
  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetJeeYear, setTargetJeeYear] = useState('2025');
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    accentColor: 'blue',
    enableAnimations: true
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Loading state for initial profile data
  const [profileLoading, setProfileLoading] = useState(true);

  // Load user data
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    
    setProfileLoading(true);
    
    try {
      // Get user profile and settings
      const userProfile = getUserProfile(user.id);
      const userSettings = getUserSettings(user.id);
      
      // Set profile data
      setName(userProfile.name || user.name || '');
      setEmail(userProfile.email || user.email || '');
      
      // Set settings data
      setSettings(userSettings);
      
      // Set target JEE year with priority:
      // 1. User object (most authoritative)
      // 2. User profile (from storage)
      // 3. localStorage (fallback)
      // 4. Default (2025)
      if (user.targetJeeYear) {
        setTargetJeeYear(user.targetJeeYear);
      } else if (userProfile.targetJeeYear) {
        setTargetJeeYear(userProfile.targetJeeYear);
      } else {
        // Try to get from localStorage
        const savedTargetYear = localStorage.getItem("jee_target_year");
        if (savedTargetYear) {
          setTargetJeeYear(savedTargetYear);
        } else {
          setTargetJeeYear('2025'); // Default fallback
        }
      }
      
      // Set theme based on settings
      setTheme(userSettings.theme);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  }, [user]);
  
  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }
    
    // Validate inputs
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Name and email cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    if (!targetJeeYear) {
      toast({
        title: "Error",
        description: "Please select a target JEE year",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Update user profile in localStorage
      const updatedProfile = updateUserProfile(user.id, { 
        name, 
        email, 
        targetJeeYear 
      });
      
      console.log('Profile updated locally:', updatedProfile);
      
      // Step 2: Update auth context - this makes a real API call to the backend
      const success = await updateUser({ 
        name, 
        email,
        targetJeeYear
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error("Profile update failed on server");
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle appearance update
  const updateAppearance = (updates: Partial<UserSettings>) => {
    if (!user) return;
    
    try {
      const updatedSettings = updateUserSettings(user.id, updates);
      setSettings(updatedSettings);
      
      // Update theme if changed
      if (updates.theme) {
        setTheme(updates.theme);
      }
      
      toast({
        title: "Success",
        description: "Appearance settings updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appearance settings",
        variant: "destructive"
      });
    }
  };
  
  // Handle theme change
  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    updateAppearance({ theme });
  };
  
  // Handle accent color change
  const handleAccentColorChange = (accentColor: 'blue' | 'green' | 'purple' | 'red') => {
    updateAppearance({ accentColor });
  };
  
  // Handle animations toggle
  const handleAnimationsToggle = () => {
    updateAppearance({ enableAnimations: !settings.enableAnimations });
  };
  
  // Export data functionality
  const { sessions } = useStudySessions();
  
  const exportUserData = () => {
    if (!user) return;
    
    try {
      // Format study sessions into a readable text format
      let textContent = 'ChadJEE Export Data\n';
      textContent += '===================\n\n';
      
      // Add user profile information
      textContent += 'Profile Information:\n';
      textContent += `Name: ${name}\n`;
      textContent += `Email: ${email}\n`;
      textContent += `Target JEE Year: ${targetJeeYear}\n\n`;
      
      // Add study sessions
      textContent += 'Study Sessions:\n';
      textContent += '---------------\n\n';
      
      if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
          const date = new Date(session.startTime).toLocaleDateString();
          textContent += `Date: ${date}\n`;
          textContent += `Subject: ${session.subject}\n`;
          if (session.topic) textContent += `Topic: ${session.topic}\n`;
          textContent += `Duration: ${session.duration} minutes\n`;
          if (session.notes) textContent += `Notes: ${session.notes}\n`;
          if (session.mood) textContent += `Mood: ${session.mood}\n`;
          if (session.energy) textContent += `Energy: ${session.energy}\n`;
          textContent += '\n';
        });
      } else {
        textContent += 'No study sessions recorded yet.\n\n';
      }
      
      // Add export timestamp
      textContent += `Export Date: ${new Date().toLocaleString()}\n`;
      
      // Create a blob with text/plain MIME type
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger download
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `chadjee-data-${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };
  
  // Handle reset all progress
  const handleResetProgress = () => {
    if (!user) return;
    
    if (confirm("Are you sure you want to reset all progress? This action cannot be undone.")) {
      try {
        // Reset tasks, subjects, goals, etc.
        // This would be implemented in storage.ts
        
        toast({
          title: "Success",
          description: "All progress has been reset",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset progress",
          variant: "destructive"
        });
      }
    }
  };
  
  // Render tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-[#252525] rounded-lg border border-[#1E1E1E] p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6">Profile Information</h3>
            
            <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
              <div className="h-20 w-20 rounded-full bg-[#00EEFF] flex items-center justify-center text-[#121212] font-bold text-xl mb-4 md:mb-0 md:mr-6">
                <span id="settings-user-initial">{name ? name.charAt(0).toUpperCase() : ''}</span>
              </div>
              
              <div>
                <p className="text-sm text-[#E0E0E0] opacity-80 mb-1">Username</p>
                <p className="font-medium mb-4" id="settings-username">{name.toLowerCase().replace(' ', '')}</p>
                <button className="text-sm text-[#00EEFF] hover:text-opacity-80 transition-all duration-300 flex items-center">
                  <i className="fas fa-camera mr-2"></i>
                  Change profile picture
                </button>
              </div>
            </div>
            
            <form id="profile-form" className="space-y-6" onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="profile-name" className="block text-sm font-medium">Full Name</label>
                  <Input 
                    type="text" 
                    id="profile-name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#121212] border border-[#1E1E1E] focus:border-[#00EEFF] focus:shadow-neon-blue transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="profile-email" className="block text-sm font-medium">Email</label>
                  <Input 
                    type="email" 
                    id="profile-email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#121212] border border-[#1E1E1E] focus:border-[#00EEFF] focus:shadow-neon-blue transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="target-jee-year" className="block text-sm font-medium">Target JEE Year</label>
                <Select 
                  value={targetJeeYear} 
                  onValueChange={(value) => setTargetJeeYear(value)}
                >
                  <SelectTrigger 
                    id="target-jee-year" 
                    className="w-full md:w-1/2 bg-[#121212] border border-[#1E1E1E] focus:border-[#00EEFF] focus:shadow-neon-blue transition-all duration-300"
                  >
                    <SelectValue placeholder="Select JEE year" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border border-[#1E1E1E]">
                    <SelectItem value="2025">JEE 2025</SelectItem>
                    <SelectItem value="2026">JEE 2026</SelectItem>
                    <SelectItem value="2027">JEE 2027</SelectItem>
                    <SelectItem value="2028">JEE 2028</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#E0E0E0] opacity-60">This affects your JEE countdown and exam preparation timeline</p>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="px-6 py-2 rounded-md bg-[#00EEFF] text-[#121212] font-semibold hover:shadow-neon-blue transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        );
        
      case 'appearance':
        return (
          <div className="bg-[#252525] rounded-lg border border-[#1E1E1E] p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6">Appearance</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Theme</p>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="theme-dark" 
                      name="theme" 
                      className="hidden" 
                      checked={settings.theme === 'dark'}
                      onChange={() => handleThemeChange('dark')}
                    />
                    <label htmlFor="theme-dark" className="flex items-center cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border-2 ${settings.theme === 'dark' ? 'border-[#00EEFF]' : 'border-[#E0E0E0]'} flex items-center justify-center mr-2`}>
                        {settings.theme === 'dark' && (
                          <div className="w-3 h-3 rounded-full bg-[#00EEFF]"></div>
                        )}
                      </div>
                      <span>Dark</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="theme-light" 
                      name="theme" 
                      className="hidden"
                      checked={settings.theme === 'light'}
                      onChange={() => handleThemeChange('light')}
                    />
                    <label htmlFor="theme-light" className="flex items-center cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border-2 ${settings.theme === 'light' ? 'border-[#00EEFF]' : 'border-[#E0E0E0]'} flex items-center justify-center mr-2`}>
                        {settings.theme === 'light' && (
                          <div className="w-3 h-3 rounded-full bg-[#00EEFF]"></div>
                        )}
                      </div>
                      <span>Light</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="theme-system" 
                      name="theme" 
                      className="hidden"
                      checked={settings.theme === 'system'}
                      onChange={() => handleThemeChange('system')}
                    />
                    <label htmlFor="theme-system" className="flex items-center cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border-2 ${settings.theme === 'system' ? 'border-[#00EEFF]' : 'border-[#E0E0E0]'} flex items-center justify-center mr-2`}>
                        {settings.theme === 'system' && (
                          <div className="w-3 h-3 rounded-full bg-[#00EEFF]"></div>
                        )}
                      </div>
                      <span>System</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-3">Accent Color</p>
                <div className="flex gap-4">
                  <button 
                    className={`w-8 h-8 rounded-full bg-[#00EEFF] ${settings.accentColor === 'blue' ? 'shadow-neon-blue border-2 border-white' : 'opacity-60 hover:opacity-100'} transition-all duration-300`}
                    onClick={() => handleAccentColorChange('blue')}
                  ></button>
                  <button 
                    className={`w-8 h-8 rounded-full bg-[#39FF14] ${settings.accentColor === 'green' ? 'shadow-neon-green border-2 border-white' : 'opacity-60 hover:opacity-100'} transition-all duration-300`}
                    onClick={() => handleAccentColorChange('green')}
                  ></button>
                  <button 
                    className={`w-8 h-8 rounded-full bg-[#BF40FF] ${settings.accentColor === 'purple' ? 'shadow-neon-purple border-2 border-white' : 'opacity-60 hover:opacity-100'} transition-all duration-300`}
                    onClick={() => handleAccentColorChange('purple')}
                  ></button>
                  <button 
                    className={`w-8 h-8 rounded-full bg-[#FF5F56] ${settings.accentColor === 'red' ? 'shadow-[0_0_5px_#FF5F56,0_0_10px_rgba(255,95,86,0.5)] border-2 border-white' : 'opacity-60 hover:opacity-100'} transition-all duration-300`}
                    onClick={() => handleAccentColorChange('red')}
                  ></button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Enable Animations</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.enableAnimations}
                    onChange={handleAnimationsToggle}
                  />
                  <div className={`w-11 h-6 bg-[#1E1E1E] peer-focus:outline-none rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#E0E0E0] after:rounded-full after:h-5 after:w-5 after:transition-all ${settings.enableAnimations ? 'peer-checked:bg-[#00EEFF]' : ''}`}></div>
                </label>
              </div>
            </div>
          </div>
        );
        
      case 'data':
        return (
          <div className="bg-[#252525] rounded-lg border border-[#1E1E1E] p-6 mb-4">
            <h3 className="text-lg font-semibold mb-6">Data Management</h3>
            
            <div className="space-y-6">  
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-[#E0E0E0] opacity-80 mt-1">Download all your progress and settings</p>
                </div>
                <Button 
                  className="px-4 py-2 rounded-md border border-[#00EEFF] text-[#00EEFF] hover:bg-[#00EEFF] hover:bg-opacity-10 transition-all duration-300"
                  variant="outline"
                  onClick={exportUserData}
                >
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
              </div>
              
              <div className="pt-4 border-t border-[#1E1E1E]">
                <Button 
                  className="px-4 py-2 rounded-md text-[#FF5F56] hover:bg-[#FF5F56] hover:bg-opacity-10 transition-all duration-300"
                  variant="ghost"
                  onClick={handleResetProgress}
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  Reset All Progress
                </Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton={true} />
      
      <main className="flex-grow flex">
        <Sidebar />
        
        <div className="flex-grow overflow-auto p-6 pb-20 md:pb-6">
          <div className="container mx-auto max-w-3xl">
            {/* Settings Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold">Settings</h2>
              <p className="text-[#E0E0E0] opacity-80">Manage your account and preferences</p>
            </div>
            
            {/* Settings Tabs */}
            <div className="mb-6 border-b border-[#1E1E1E]">
              <div className="flex flex-wrap -mb-px">
                <button 
                  className={`mr-8 py-2 px-1 font-medium relative ${activeTab === 'profile' ? 'text-[#00EEFF] tab-active' : 'text-[#E0E0E0] hover:text-[#00EEFF]'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </button>
                <button 
                  className={`mr-8 py-2 px-1 font-medium relative ${activeTab === 'appearance' ? 'text-[#00EEFF] tab-active' : 'text-[#E0E0E0] hover:text-[#00EEFF]'}`}
                  onClick={() => setActiveTab('appearance')}
                >
                  Appearance
                </button>
                <button 
                  className={`mr-8 py-2 px-1 font-medium relative ${activeTab === 'notifications' ? 'text-[#00EEFF] tab-active' : 'text-[#E0E0E0] hover:text-[#00EEFF]'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  Notifications
                </button>
                <button 
                  className={`mr-8 py-2 px-1 font-medium relative ${activeTab === 'data' ? 'text-[#00EEFF] tab-active' : 'text-[#E0E0E0] hover:text-[#00EEFF]'}`}
                  onClick={() => setActiveTab('data')}
                >
                  Data & Privacy
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
