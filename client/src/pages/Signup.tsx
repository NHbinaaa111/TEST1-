import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

export default function Signup() {
  const [, navigate] = useLocation();
  const { signup } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    if (!terms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await signup(name, email, password);
      toast({
        title: "Success",
        description: "Account created successfully! Please login.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Could not create account",
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
          <h2 className="text-2xl font-poppins font-bold mb-6 text-center neon-text-green">Create Your Account</h2>
          
          <form id="signup-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="signup-name" className="block text-sm font-medium">Full Name</label>
              <input 
                type="text" 
                id="signup-name" 
                className="w-full px-4 py-2 rounded-md bg-[#121212] border border-[#1E1E1E] focus:border-[#39FF14] focus:outline-none focus:shadow-neon-green transition-all duration-300" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signup-email" className="block text-sm font-medium">Email</label>
              <input 
                type="email" 
                id="signup-email" 
                className="w-full px-4 py-2 rounded-md bg-[#121212] border border-[#1E1E1E] focus:border-[#39FF14] focus:outline-none focus:shadow-neon-green transition-all duration-300" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signup-password" className="block text-sm font-medium">Password</label>
              <input 
                type="password" 
                id="signup-password" 
                className="w-full px-4 py-2 rounded-md bg-[#121212] border border-[#1E1E1E] focus:border-[#39FF14] focus:outline-none focus:shadow-neon-green transition-all duration-300" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium">Confirm Password</label>
              <input 
                type="password" 
                id="signup-confirm-password" 
                className="w-full px-4 py-2 rounded-md bg-[#121212] border border-[#1E1E1E] focus:border-[#39FF14] focus:outline-none focus:shadow-neon-green transition-all duration-300" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="terms" 
                className="h-4 w-4 rounded border-[#1E1E1E] text-[#39FF14] focus:ring-[#39FF14]" 
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm">I agree to the <a href="#" className="text-[#39FF14] hover:text-opacity-80">Terms of Service</a> and <a href="#" className="text-[#39FF14] hover:text-opacity-80">Privacy Policy</a></label>
            </div>
            
            <div>
              <button 
                type="submit" 
                className="w-full py-2 px-4 rounded-md bg-[#39FF14] text-[#121212] font-semibold hover:shadow-neon-green transition-all duration-300"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm">Already have an account? <a onClick={() => navigate('/login')} className="text-[#00EEFF] hover:text-opacity-80 transition-all duration-300 cursor-pointer">Login</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}
