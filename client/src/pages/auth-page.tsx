import * as React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { Loader2, Home } from "lucide-react";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  
  // Clear email field ref to track changes between submissions
  const lastSubmittedEmail = React.useRef("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // State for error/success messages
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  // CRITICAL FIX: Add an effect to clear error when email changes from the last submitted one
  useEffect(() => {
    if (registerEmail) {
      // Normalize both emails for case-insensitive comparison 
      const normalizedCurrentEmail = registerEmail.trim().toLowerCase();
      const normalizedLastEmail = lastSubmittedEmail.current.trim().toLowerCase();
      
      if (normalizedCurrentEmail !== normalizedLastEmail) {
        console.log("Email changed, clearing registration errors", {
          current: normalizedCurrentEmail.substring(0,3) + "***",
          previous: normalizedLastEmail ? normalizedLastEmail.substring(0,3) + "***" : "none"
        });
        setRegisterError(null);
      }
    }
  }, [registerEmail]);
  
  // Component cleanup effect - critical for proper reset between mount/unmount cycles
  useEffect(() => {
    // Reset form state when component mounts
    setRegisterError(null);
    lastSubmittedEmail.current = "";
    
    return () => {
      // Clean up state when component unmounts
      setRegisterError(null);
      lastSubmittedEmail.current = "";
    };
  }, []);

  // Handle login submit with improved error handling
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginSubmitting(true);
    
    try {
      console.log('Submitting login form with email:', loginEmail);
      const success = await login(loginEmail, loginPassword);
      
      if (success) {
        console.log('Login successful, redirecting...');
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } else {
        console.log('Login failed');
        setLoginError("Invalid email or password");
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Extract meaningful error message
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        // Use the error message from the server if available
        errorMessage = error.message;
      }
      
      // Set error message for the UI
      setLoginError(errorMessage);
      
      // Show toast with the same error message
      toast({
        title: "Login error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // Handle register submit - FIXED to properly handle registration errors
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Always clear errors at the start of submission
    setRegisterError(null);
    setIsRegisterSubmitting(true);
    
    // Normalize email (trim and lowercase) before submission
    const normalizedEmail = registerEmail.trim().toLowerCase();
    
    // Store this email as the last submitted one for change detection
    lastSubmittedEmail.current = normalizedEmail;
    
    try {
      console.log('Submitting registration form with email:', normalizedEmail);
      
      // Use normalized email in registration request - this will throw an error if there's a problem
      const success = await register(registerName, normalizedEmail, registerPassword);
      
      // If we get here, registration was successful
      if (success) {
        // Clear the form on success
        setRegisterName("");
        setRegisterEmail("");
        setRegisterPassword("");
        lastSubmittedEmail.current = "";
        
        console.log('Registration successful, redirecting...');
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Extra verbose debugging and error handling
      console.log("SIGNUP ERROR DETAILS:", {
        isError: error instanceof Error,
        errorMessage: error instanceof Error ? error.message : String(error),
        emailUsed: normalizedEmail
      });
      
      // Extract the error message
      let errorMessage = "Registration failed. Please try again.";
      let errorTitle = "Registration Error";
      
      if (error instanceof Error) {
        // Parse specific error messages
        if (error.message.includes("Email already exists") || 
            error.message.toLowerCase().includes("already registered")) {
          errorMessage = "This email is already registered. Please use a different email address.";
          errorTitle = "Email Already Registered";
        } else if (error.message.includes("database") || error.message.includes("server")) {
          errorMessage = "Our server is having trouble right now. Please try again in a few moments.";
          errorTitle = "Server Issue";
        } else if (error.message.includes("password")) {
          errorMessage = error.message; // Use the specific password error message
          errorTitle = "Password Issue";
        } else {
          // Use the original error message if it exists
          errorMessage = error.message || errorMessage;
        }
      }
      
      // Set error in the UI
      setRegisterError(errorMessage);
      
      // Store the error-causing email for proper change detection
      lastSubmittedEmail.current = normalizedEmail;
      
      // Show toast with the error message
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-[#121212] border-[#3A3A3A] hover:border-[#00EEFF] hover:bg-[#121212]/80 transition-all">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm border border-[#3A3A3A]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Enter your credentials to access your account" 
                : "Register to track your JEE preparation journey"}
            </CardDescription>
          </CardHeader>
          <Tabs 
            defaultValue="login" 
            onValueChange={(v) => {
              // CRITICAL FIX: Reset error states when changing tabs
              setActiveTab(v as "login" | "register");
              if (v === "register") {
                setRegisterError(null);
                lastSubmittedEmail.current = "";
              } else {
                setLoginError(null);
              }
            }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input 
                      id="login-email"
                      type="email" 
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError(null);
                      }}
                      className={loginError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password"
                      type="password" 
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      className={loginError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  {loginError && (
                    <div className="text-sm text-red-500 font-medium">
                      {loginError}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoginSubmitting}
                  >
                    {isLoginSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : "Log in"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input 
                      id="register-name"
                      type="text" 
                      placeholder="Enter your full name"
                      value={registerName}
                      onChange={(e) => {
                        setRegisterName(e.target.value);
                        setRegisterError(null);
                      }}
                      className={registerError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email"
                      type="email" 
                      placeholder="Enter your email"
                      value={registerEmail}
                      onChange={(e) => {
                        // CRITICAL FIX: Always clear errors when email changes
                        const newEmail = e.target.value;
                        setRegisterEmail(newEmail);
                        
                        // Clear error state immediately
                        setRegisterError(null);
                        
                        // Explicitly log both emails for comparison in case of debugging
                        console.log("Email input changed:", { 
                          from: lastSubmittedEmail.current.substring(0,3) + "***", 
                          to: newEmail.substring(0,3) + "***", 
                          errorsCleared: true 
                        });
                        
                        // Add extra check for changes compared to the last error-triggering email
                        if (newEmail.trim().toLowerCase() !== lastSubmittedEmail.current) {
                          console.log("Email different from last error-causing email - errors definitely reset");
                        }
                      }}
                      onFocus={() => {
                        // Additional safety: Clear errors on focus
                        if (registerError) {
                          setRegisterError(null);
                        }
                      }}
                      className={registerError ? "border-red-500" : ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input 
                      id="register-password"
                      type="password" 
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        setRegisterError(null);
                      }}
                      className={registerError ? "border-red-500" : ""}
                      required
                      minLength={6}
                    />
                  </div>
                  {registerError && (
                    <div className="text-sm text-red-500 font-medium">
                      {registerError}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isRegisterSubmitting}
                  >
                    {isRegisterSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : "Create account"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-primary/20 to-primary/5 hidden md:flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Your JEE Preparation Journey Starts Here
          </h1>
          <p className="text-lg text-foreground/70">
            ChadJEE helps you track your progress, manage study time, and stay focused on your goal of cracking the JEE exam.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#00EEFF]">Track Progress</h3>
              <p className="text-sm text-foreground/70">Monitor your syllabus completion and test performance</p>
            </div>
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#0FFF50]">Manage Time</h3>
              <p className="text-sm text-foreground/70">Optimize your study hours with pomodoro technique</p>
            </div>
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#5E17EB]">Set Goals</h3>
              <p className="text-sm text-foreground/70">Plan weekly and monthly targets to stay motivated</p>
            </div>
            <div className="bg-[#121212]/70 backdrop-blur-sm p-4 rounded-lg border border-[#3A3A3A]">
              <h3 className="font-semibold text-[#00EEFF]">Analyze Performance</h3>
              <p className="text-sm text-foreground/70">Gain insights from your study sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}