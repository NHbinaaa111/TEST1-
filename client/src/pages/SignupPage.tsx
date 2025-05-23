import { useState, FormEvent, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SignupPage() {
  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetJEEYear, setTargetJEEYear] = useState('2025');
  
  // Error states - completely separate to avoid any persistence issues
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form tracking state
  const [formEdited, setFormEdited] = useState(false);
  
  // Hooks
  const { signup, validatePassword } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  /**
   * CRITICAL FIX: This is the core function that clears all error states
   * It must be called whenever the email field changes to fix the persistence bug
   */
  const clearAllErrors = useCallback(() => {
    // Reset all error states to empty strings
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    
    // Also force-clear any form-level error state and UI elements
    document.querySelectorAll('.form-error').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  }, []);

  // CRITICAL FIX: Clear ALL errors whenever email changes - this fixes the persistence issue
  useEffect(() => {
    if (email) {
      // Always clear all errors when email field changes
      setEmailError('');
      setGeneralError('');
      setPasswordError('');
      console.log('DIAGNOSTICS - Frontend: Email changed to:', email.substring(0, 3) + '*** - All errors cleared');
    }
    setFormEdited(true);
  }, [email]);

  // Effect hook to clear password errors on each keystroke
  useEffect(() => {
    // Validate password format/complexity but don't show mismatch errors until user has typed something
    if (password) {
      const { valid, message } = validatePassword(password);
      setPasswordError(valid ? '' : message);
    } else {
      setPasswordError('');
    }
    setFormEdited(true);
  }, [password, validatePassword]);

  // Effect to clear the mismatch error as user types the confirmation password
  useEffect(() => {
    setFormEdited(true);
  }, [confirmPassword]);

  // Effect to clear errors when component mounts (essential for navigation issues)
  useEffect(() => {
    console.log('SignupPage mounted - clearing all errors');
    clearAllErrors();
    setFormEdited(false);
    
    // This effect ensures the form is pristine when returning to the signup page
    return () => {
      console.log('SignupPage unmounting - cleanup');
    };
  }, [clearAllErrors]);

  // Input change handlers with explicit error-clearing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setFormEdited(true);
    clearAllErrors(); // Clear any existing errors when user changes name
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // CRITICAL FIX: First set the email value
    setEmail(e.target.value);
    
    // CRITICAL FIX: Then immediately clear ALL errors
    // This is the key fix for the persistence bug
    clearAllErrors();
    
    // Mark form as edited
    setFormEdited(true);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFormEdited(true);
    // Only clear the password error, not email errors
    setPasswordError(''); 
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setFormEdited(true);
    // Check for match only if both password fields have values
    if (password && e.target.value && password !== e.target.value) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handleTargetYearChange = (value: string) => {
    setTargetJEEYear(value);
    setFormEdited(true);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Submitting signup form, clearing all previous errors');
    
    // ALWAYS clear ALL error states at the beginning of submission
    clearAllErrors();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Form already submitting, ignoring submission request');
      return;
    }
    
    // Local form validation
    if (!name || !email || !password || !confirmPassword) {
      const errorMsg = "Please fill in all fields";
      console.log('Form validation failed:', errorMsg);
      setGeneralError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    // Validate password complexity
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      console.log('Password validation failed:', passwordCheck.message);
      setPasswordError(passwordCheck.message);
      toast({
        title: "Password Error",
        description: passwordCheck.message,
        variant: "destructive"
      });
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      const mismatchError = 'Passwords do not match';
      console.log('Password validation failed:', mismatchError);
      setPasswordError(mismatchError);
      toast({
        title: "Password Error",
        description: mismatchError,
        variant: "destructive"
      });
      return;
    }

    // All validation passed, set submitting state
    console.log('Form validation passed, proceeding with submission');
    setIsSubmitting(true);

    try {
      // Save the target JEE year to localStorage
      localStorage.setItem("jee_target_year", targetJEEYear);
      
      // Generate a random suffix for testing
      const timestamp = new Date().getTime().toString().slice(-4);
      
      // Prepare a clean version of the email - critical for consistent backend validation
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log(`Attempting signup with email: ${normalizedEmail.substring(0, 3)}***`);
      
      // Create the user account
      const user = await signup(name, normalizedEmail, password);
      
      // If we get here, the signup was successful!
      console.log('Signup successful, resetting form and navigating to login');
      
      // Clear all form fields and errors on success
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      clearAllErrors();
      setFormEdited(false);
      
      // Show success message
      toast({
        title: "Success",
        description: "Account created successfully! You can now login.",
      });
      
      // Navigate to login page
      navigate('/login');
    } catch (error: any) {
      // CRITICAL FIX: First clear ALL errors to avoid any state persistence
      clearAllErrors();
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // CRITICAL FIX: Check for the EXACT error message we expect from the backend
        if (errorMessage === "Email already exists") {
          // Set the email error state ONLY for the exact email error message
          setEmailError('This email is already registered');
          
          toast({
            title: "Email Error",
            description: "This email is already registered. Please use a different email address.",
            variant: "destructive"
          });
        } else {
          // For all other errors
          setGeneralError('Signup failed. Please try again.');
          
          toast({
            title: "Registration Error",
            description: 'Signup failed. Please try again.',
            variant: "destructive"
          });
        }
      } else {
        // For non-Error objects, show a generic message
        setGeneralError('Signup failed. Please try again.');
        
        toast({
          title: "Registration Error",
          description: 'Signup failed. Please try again.',
          variant: "destructive"
        });
      }
    } finally {
      // Always reset submission state
      setIsSubmitting(false);
    }
  };

  return (
    <div id="signup-page" className="page active flex flex-col min-h-screen">
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
        <div className="w-full max-w-md p-8 bg-[#1E1E1E] rounded-xl shadow-lg" data-aos="zoom-in">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
          
          {/* Show general error at the top of the form if present */}
          {generalError && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-sm text-red-200 form-error">
              {generalError}
            </div>
          )}
          
          <form id="signup-form" className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input 
                type="text" 
                id="signup-name" 
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]" 
                value={name}
                onChange={handleNameChange}
                required
                aria-invalid={!name && formEdited}
              />
            </div>
            
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                id="signup-email" 
                className={`w-full px-4 py-3 bg-[#2A2A2A] border ${
                  emailError ? 'border-red-500 focus:ring-red-500' : 'border-[#3A3A3A]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]`}
                value={email}
                onChange={handleEmailChange}
                required
                aria-invalid={!!emailError}
                aria-errormessage="email-error"
              />
              {emailError && (
                <p id="email-error" className="text-red-500 text-xs mt-1 form-error">{emailError}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-xs text-gray-400">(minimum 6 characters)</span>
              </label>
              <input 
                type="password" 
                id="signup-password" 
                className={`w-full px-4 py-3 bg-[#2A2A2A] border ${
                  passwordError ? 'border-red-500 focus:ring-red-500' : 'border-[#3A3A3A]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]`}
                value={password}
                onChange={handlePasswordChange}
                required
                aria-invalid={!!passwordError}
                aria-errormessage="password-error"
              />
              {passwordError && (
                <p id="password-error" className="text-red-500 text-xs mt-1 form-error">{passwordError}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input 
                type="password" 
                id="signup-confirm-password" 
                className={`w-full px-4 py-3 bg-[#2A2A2A] border ${
                  password !== confirmPassword && confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-[#3A3A3A]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#5E17EB]`}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-red-500 text-xs mt-1 form-error">Passwords do not match</p>
              )}
            </div>
            
            <div>
              <label htmlFor="target-jee-year" className="block text-sm font-medium text-gray-300 mb-2">
                Target JEE Year
              </label>
              <Select 
                value={targetJEEYear} 
                onValueChange={handleTargetYearChange}
              >
                <SelectTrigger id="target-jee-year" className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border border-[#3A3A3A]">
                  <SelectItem value="2025">JEE 2025</SelectItem>
                  <SelectItem value="2026">JEE 2026</SelectItem>
                  <SelectItem value="2027">JEE 2027</SelectItem>
                  <SelectItem value="2028">JEE 2028</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">This helps customize your exam countdown</p>
            </div>
            
            <div>
              <button 
                type="submit" 
                className={`w-full py-3 rounded-md text-white font-medium transition duration-300 ${
                  isSubmitting 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-[#5E17EB] hover:bg-opacity-90'
                }`}
                disabled={!!(isSubmitting || passwordError || (password !== confirmPassword && confirmPassword))}
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
            
            <div className="text-sm text-center">
              <p className="text-gray-400">
                Already have an account? 
                <Link href="/login" className="text-[#00EEFF] hover:underline ml-1" onClick={clearAllErrors}>
                  Log In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;
