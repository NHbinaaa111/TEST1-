import { useState, FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    try {
      // Always normalize email
      const normalizedEmail = email.trim().toLowerCase();
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password })
      });
      
      // Properly handle different response statuses
      if (response.status === 500) {
        console.error('Server error during login:', response.status);
        toast({
          title: "Server Error",
          description: "Our system is temporarily unavailable. Please try again in a few moments.",
          variant: "destructive"
        });
        return;
      }
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Invalid response format:', e);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (response.ok) {
        console.log('Login successful!', data);
        toast({
          title: "Success",
          description: "Login successful!",
        });
        
        // Wait a moment for the toast to appear before navigating
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        console.error('Login failed:', data);
        toast({
          title: "Login Failed",
          description: data.error || "Incorrect email or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Connection Error",
        description: "Cannot connect to the server. Please check your internet connection and try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "If your email exists in our system, you'll receive a password reset link",
        });
        
        // If we're in development, we can show the reset URL (it would normally be emailed)
        if (data.resetUrl) {
          console.log('Password reset URL:', data.resetUrl);
          toast({
            title: "Development Mode",
            description: "A reset link has been logged to the console",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process your request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: "A network error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  


  return (
    <div id="login-page" className="page active flex flex-col min-h-screen">
      <header className="py-6 px-6 md:px-16 flex justify-between items-center border-b border-[#3A3A3A]">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-bold cursor-pointer">
              <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
            </h1>
          </Link>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        {!showForgotPassword ? (
          <div className="w-full max-w-md p-8 bg-[#1E1E1E] rounded-xl shadow-lg" data-aos="zoom-in">
            <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
            <form id="login-form" className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  id="login-email" 
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input 
                  type="password" 
                  id="login-password" 
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-right">
                <button 
                  type="button" 
                  className="text-[#00EEFF] text-sm hover:underline" 
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>
              <div>
                <button type="submit" className="w-full py-3 rounded-md bg-[#00EEFF] text-[#121212] font-medium hover:bg-opacity-90 transition duration-300">
                  Log In
                </button>
              </div>
              <div className="text-sm text-center">
                <p className="text-gray-400">
                  Don't have an account? 
                  <Link href="/signup" className="text-[#0FFF50] hover:underline ml-1">Sign Up</Link>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-md p-8 bg-[#1E1E1E] rounded-xl shadow-lg" data-aos="zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Reset Password</h2>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-gray-300 mb-4">Enter your email address to receive a password reset link.</p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      id="reset-email" 
                      className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#00EEFF]" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-md bg-[#5E17EB] text-white font-medium hover:bg-opacity-90 transition duration-300">
                    Send Reset Link
                  </button>
                </form>
              </div>
              
              <div className="border-t border-[#3A3A3A] pt-6 text-center">
                <p className="text-gray-300 mb-4">You'll receive an email with reset instructions.</p>
                <button 
                  className="text-[#00EEFF] text-sm hover:underline"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LoginPage;
