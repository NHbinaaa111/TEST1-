import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md p-8 bg-[#252525] rounded-lg border border-[#1E1E1E]" data-aos="zoom-in">
          <h2 className="text-2xl font-poppins font-bold mb-6 text-center neon-text-blue">Login to Your Account</h2>
          
          <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-sm font-medium">Email</label>
              <input 
                type="email" 
                id="login-email" 
                className="w-full px-4 py-2 rounded-md bg-[#121212] border border-[#1E1E1E] focus:border-[#00EEFF] focus:outline-none focus:shadow-neon-blue transition-all duration-300" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-sm font-medium">Password</label>
              <input 
                type="password" 
                id="login-password" 
                className="w-full px-4 py-2 rounded-md bg-[#121212] border border-[#1E1E1E] focus:border-[#00EEFF] focus:outline-none focus:shadow-neon-blue transition-all duration-300" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  className="h-4 w-4 rounded border-[#1E1E1E] text-[#00EEFF] focus:ring-[#00EEFF]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm">Remember me</label>
              </div>
              <div className="text-sm">
                <a href="#" className="text-[#BF40FF] hover:text-opacity-80 transition-all duration-300">Forgot password?</a>
              </div>
            </div>
            
            <div>
              <button 
                type="submit" 
                className="w-full py-2 px-4 rounded-md bg-[#00EEFF] text-[#121212] font-semibold hover:shadow-neon-blue transition-all duration-300"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm">Don't have an account? <a onClick={() => navigate('/signup')} className="text-[#39FF14] hover:text-opacity-80 transition-all duration-300 cursor-pointer">Sign up</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
