import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface PasswordValidation {
  valid: boolean;
  message: string;
}

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<any>) => Promise<boolean>;
  validatePassword: (password: string) => PasswordValidation;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Always normalize email before sending to server
      const normalizedEmail = email.trim().toLowerCase();
      console.log('Login attempt:', { email: normalizedEmail.substring(0,3) + '***' });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      console.log('Login response status:', response.status);
      
      // Handle success case
      if (response.ok) {
        const userData = await response.json();
        console.log('Login successful, user data received');
        setUser(userData);
        return true;
      } else {
        // Improved error handling with specific error messages
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Invalid error response format:', e);
          // When the response can't be parsed as JSON, provide a more meaningful error
          if (response.status === 500) {
            throw new Error('A server error occurred. Please try again later.');
          } else if (response.status === 401) {
            throw new Error('Invalid email or password');
          } else if (response.status === 429) {
            throw new Error('Too many login attempts. Please try again later.');
          }
          throw new Error('Login failed. Please check your connection and try again.');
        }
        
        console.error('Login failed:', errorData);
        
        // Throw detailed error for better error handling in the UI
        if (errorData) {
          if (errorData.error) {
            throw new Error(errorData.error);
          } else if (errorData.message) {
            throw new Error(errorData.message);
          } else if (errorData.debug?.error) {
            throw new Error('Login failed: ' + errorData.debug.error);
          } else if (response.status === 401) {
            throw new Error('Invalid email or password');
          }
        }
        
        throw new Error('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error types
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to the server. Please check your internet connection.');
      }
      
      throw error; // Rethrow for the login form to handle
    }
  };

  const validatePassword = (password: string): PasswordValidation => {
    if (!password || password.length < 6) {
      return {
        valid: false,
        message: "Password must be at least 6 characters long"
      };
    }
    return { valid: true, message: "" };
  };

  /**
   * Improved signup function with robust error handling
   * This creates a new user account
   */
  const signup = async (name: string, email: string, password: string) => {
    try {
      // Always normalize email before sending to server
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log(`AUTH HOOK: Sending registration request for email: ${normalizedEmail.substring(0,3)}***`);
      
      // Make the request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          name, 
          email: normalizedEmail,
          password 
        }),
      });

      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse server response:', e);
        // Handle specific HTTP error codes with clear messages
        if (response.status === 500) {
          throw new Error('The server encountered an error. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Please check your information and try again.');
        } else if (response.status === 409) {
          throw new Error('This email address is already registered.');
        }
        throw new Error('Registration failed. Please try again later.');
      }
      
      // Log the response for debugging
      console.log("AUTH HOOK: Registration response:", {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      // Success case - only happens with 2xx status
      if (response.ok) {
        return data;
      }
      
      // Handle error responses with proper messages
      if (data) {
        if (data.message === "Email already exists" || 
            (data.message && data.message.toLowerCase().includes('already exists'))) {
          console.log("AUTH HOOK: Email already exists error detected");
          throw new Error('This email is already registered. Please use a different email address or try logging in.');
        } else if (data.message && data.message.includes('System configuration error')) {
          console.log("AUTH HOOK: Database setup error detected");
          throw new Error('Our system is currently being updated. Please try again in a few minutes.');
        } else if (data.message) {
          console.log(`AUTH HOOK: Server returned error: "${data.message}"`);
          throw new Error(data.message);
        } else if (data.error) {
          console.log(`AUTH HOOK: Server returned error: "${data.error}"`);
          throw new Error(data.error);
        }
      }
      
      // Generic error for anything else
      console.log("AUTH HOOK: Generic signup failure", data);
      throw new Error('Registration failed. Please try again.');
    } catch (error: unknown) {
      // Ensure we always throw an Error object with proper message
      if (!(error instanceof Error)) {
        console.error("AUTH HOOK: Unknown error type", error);
        throw new Error('Signup failed. Try again.');
      }
      
      // Log and forward the original error
      console.error("AUTH HOOK: Registration error:", error.message);
      throw error;
    }
  };
  
  // Enhanced register function with improved error handling
  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await signup(name, email, password);
      
      // Success case - set user and return true
      if (result && result.success) {
        console.log("Registration successful, setting user:", result.user);
        setUser(result.user);
        return true;
      }
      
      // This shouldn't normally happen as failed registrations throw errors
      console.warn("Registration returned success:false without throwing an error");
      return false;
    } catch (error: any) {
      // Provide specific error messages for known issues
      console.error('Registration error details:', error);
      
      const errorMessage = error?.message || '';
      
      // Check for common error types and provide helpful messages
      if (errorMessage.includes('Email already exists')) {
        throw new Error('That email is already registered. Please use a different email or try logging in.');
      } 
      else if (errorMessage.includes('database') || errorMessage.includes('service')) {
        throw new Error('Our server is having trouble right now. Please try again in a few moments.');
      }
      else if (errorMessage.includes('password')) {
        throw new Error(errorMessage);
      }
      
      // Generic fallback for unexpected errors
      throw error; // Rethrow to allow error handling in the UI
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<any>): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser((prev: any) => ({ ...prev, ...updatedUser }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    signup,
    logout,
    checkAuth,
    updateUser,
    validatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
