import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import crypto from "crypto";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";

const PostgresSessionStore = connectPg(session);
const SALT_ROUNDS = 10;

// Secure password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Secure password comparison with bcrypt
async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  // Set up session storage
  const sessionStore = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
  });

  // Session configuration
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "chadjee-app-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        // Always require HTTPS in production - this is mandatory for cross-site cookies
        secure: process.env.NODE_ENV === "production", 
        
        // 30 days expiration 
        maxAge: 30 * 24 * 60 * 60 * 1000,
        
        // Critical for cross-origin usage in production
        // Must be 'none' for cross-domain requests with credentials
        // Must be paired with secure:true in production
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        
        // Prevents JavaScript access to the cookie - security best practice
        httpOnly: true,
        
        // Don't set domain in production - each service on Render has its own domain
        // Let the browser determine the correct domain scope for the cookie
      },
      proxy: true, // Always trust the reverse proxy, needed for secure cookies behind proxies
    })
  );
  
  // Add a middleware to explicitly set proper CORS headers for authentication
  app.use((req, res, next) => {
    // Only set these headers for auth-related endpoints
    if (req.path.startsWith('/api/auth/')) {
      // Make sure Set-Cookie headers are exposed to the client
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
      
      // Ensure browsers include cookies with requests
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Set proper Cache-Control headers to prevent caching of auth responses
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for email/password login
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          // Enhanced email normalization to prevent case-sensitivity issues
          const normalizedEmail = email.toLowerCase().trim();
          console.log(`Login attempt: ${normalizedEmail.substring(0,3)}***`);
          
          // Check for database connection first
          try {
            // Get user from database with better error handling
            const user = await storage.getUserByEmail(normalizedEmail);
            
            // If user not found, provide a clear but secure error
            // We use the same error message for both "user not found" and "wrong password"
            // for security reasons (prevents email enumeration attacks)
            if (!user) {
              console.log('Login failed: User not found for email:', normalizedEmail.substring(0,3) + '***');
              return done(null, false, { message: "Incorrect email or password" });
            }
            
            // Improved password comparison with extra error handling
            try {
              // bcrypt.compare can occasionally throw errors with invalid input
              const passwordsMatch = await comparePasswords(password, user.password);
              
              if (!passwordsMatch) {
                console.log('Login failed: Password incorrect for user:', user.id);
                return done(null, false, { message: "Incorrect email or password" });
              }
              
              console.log('Login successful for user:', user.id);
              return done(null, user);
            } catch (passwordErr) {
              console.error('Password comparison error:', passwordErr);
              return done(null, false, { message: "Authentication failed. Please try again." });
            }
          } catch (dbError: any) {
            // Handle database-specific errors
            console.error('Database error during login:', dbError);
            
            if (dbError.message?.includes('relation "users" does not exist') ||
                dbError.code === '42P01') { // PostgreSQL table missing error
              return done(new Error('Database setup incomplete. User tables missing.'));
            }
            
            if (dbError.code === 'ECONNREFUSED' || 
                dbError.code === 'ETIMEDOUT' || 
                (dbError.message && dbError.message.includes('connection'))) {
              return done(new Error('Database connection error, please try again later.'));
            }
            
            return done(dbError);
          }
        } catch (error) {
          console.error('Unexpected login error:', error);
          return done(error);
        }
      }
    )
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      
      // If user not found, return false instead of error to prevent crashes
      if (!user) {
        console.log(`Deserialization warning: User ${id} not found in database`);
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      // Log the error but don't crash the application
      console.error('User deserialization error:', error);
      done(null, false);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Basic validation
      if (!email || !password || !name) {
        return res.status(400).json({ 
          success: false,
          message: "All fields are required"
        });
      }
      
      // Simple email normalization
      const normalizedEmail = email.toLowerCase().trim();
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ 
          success: false,
          message: "Please enter a valid email address"
        });
      }
      
      // Check if user already exists with better error handling
      try {
        // Try to retrieve existing user and handle different scenarios
        const existingUser = await storage.getUserByEmail(normalizedEmail);
        
        if (existingUser) {
          console.log(`Registration error: Email already exists (${normalizedEmail.substring(0,3)}***)`);
          return res.status(400).json({ 
            success: false, 
            message: "Email already exists"
          });
        }
        
        console.log(`Email check passed for new registration: ${normalizedEmail.substring(0,3)}***`);
        
      } catch (emailCheckError) {
        // Log the database error but allow registration to continue
        // This prevents false rejections due to database connection issues
        console.error("Error checking for existing email:", emailCheckError);
        
        // If error clearly indicates relation doesn't exist, the tables are not set up
        const errorString = String(emailCheckError);
        if (errorString.includes('relation "users" does not exist')) {
          console.error("Database tables not found. Setup required.");
          return res.status(500).json({
            success: false,
            message: "System configuration error. Please contact support."
          });
        }
      }
      
      // Hash password and create user (async with bcrypt)
      const hashedPassword = await hashPassword(password);
      
      // Create user with normalized email
      const user = await storage.createUser({
        email: normalizedEmail,
        password: hashedPassword,
        name
      });
      
      // Set up default user settings
      await storage.createOrUpdateUserSettings({
        userId: user.id,
        theme: "system",
        accentColor: "blue",
        enableAnimations: true,
        studyHoursGoal: 35,
        pomodoroWorkTime: 25,
        pomodoroBreakTime: 5,
        pomodoroLongBreakTime: 15,
        pomodoroCycles: 4
      });
      
      // Login the new user automatically
      req.login(user, (err) => {
        if (err) {
          console.error('Auto-login failed:', err);
          // Even if auto-login fails, registration was successful
          const { password, ...userWithoutPassword } = user;
          return res.status(201).json({ 
            success: true,
            message: "Registration successful! Please login.",
            user: userWithoutPassword
          });
        }
        
        // Return user without password and a success message
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json({ 
          success: true,
          message: "Registration successful!",
          user: userWithoutPassword
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Improved and more specific error handling
      const errorMsg = error.message?.toLowerCase() || '';
      
      // Handle our custom errors
      if (error.name === 'DuplicateUserError') {
        console.log('Duplicate user error caught during registration');
        return res.status(400).json({
          success: false,
          message: "This email is already registered. Please use a different email or try logging in."
        });
      }
      
      // Handle database connection errors
      if (error.name === 'DatabaseConnectionError' ||
          error.code === 'XX000' || 
          error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' ||
          errorMsg.includes("connect") || 
          errorMsg.includes("connection") ||
          errorMsg.includes("timeout")) {
        
        console.log('Database connection error detected');
        return res.status(503).json({
          success: false,
          message: "We're experiencing technical difficulties. Please try again in a few moments."
        });
      }
      
      // Check for duplicate email errors in various DB implementations
      if (errorMsg.includes('duplicate') || 
          errorMsg.includes('unique constraint') || 
          errorMsg.includes('already exists') ||
          error.code === '23505') {
        
        console.log('Caught duplicate email error from database');
        return res.status(400).json({
          success: false,
          message: "This email is already registered. Please use a different email or try logging in."
        });
      }
      
      // Missing relation/table error handling
      if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
        console.error('Database schema issue detected:', errorMsg);
        return res.status(500).json({
          success: false,
          message: "We're currently updating our system. Please try again in a few minutes."
        });
      }
      
      // Password-related errors
      if (errorMsg.includes('password')) {
        return res.status(400).json({
          success: false,
          message: "There was an issue with your password. Please ensure it meets requirements and try again."
        });
      }
      
      // More specific message for server errors
      console.log('Unhandled registration error');
      return res.status(500).json({
        success: false,
        message: "We couldn't complete your registration at this time. Please try again later."
      });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    // Enhanced logging for all environments to help troubleshoot login issues
    console.log('Login attempt | email:', req.body.email);
    console.log('Login debug | has session:', !!req.session);
    console.log('Login debug | has cookies:', !!req.headers.cookie);
    console.log('Login debug | origin:', req.headers.origin || 'unknown');
    
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      
      if (!user) {
        const errorMessage = info?.message || "Authentication failed";
        console.log('Login failed:', errorMessage);
        return res.status(401).json({ error: errorMessage });
      }
      
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) {
          console.error('Session setup error:', loginErr);
          return next(loginErr);
        }
        
        // Log successful login and session ID
        console.log('Login successful | user:', user.id);
        console.log('Login successful | sessionID:', req.sessionID);
        
        // Make sure cookies are set properly
        if (req.session) {
          // Save the session explicitly to ensure cookie is set
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error:', saveErr);
              return next(saveErr);
            }
            
            // Add extra security headers for authentication responses
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            
            // Ensure authentication state is properly maintained by setting
            // explicit authentication cookie configuration in header
            // This sets the cookie parameters even if the session middleware failed
            // to set it properly - provides a backup mechanism
            // Only do this in production environments
            if (process.env.NODE_ENV === 'production') {
              const cookieOptions = [
                `connect.sid=${req.sessionID}`,
                'Path=/',
                'HttpOnly',
                'SameSite=None',
                'Secure'
              ];
              res.setHeader('Set-Cookie', cookieOptions.join('; '));
            }
            
            // Store user's targetJeeYear in session if available
            if (user.targetJeeYear && req.session) {
              req.session.targetJeeYear = user.targetJeeYear;
            }
            
            // Remove password from response
            const { password, ...userWithoutPassword } = user;
            
            // Create response with targetJeeYear from user or null
            const userData = {
              ...userWithoutPassword,
              targetJeeYear: user.targetJeeYear || req.session?.targetJeeYear || null
            };
            
            // Include more information in response for debugging in non-production
            const responseData = process.env.NODE_ENV === 'production'
              ? userData
              : {
                  ...userData,
                  debug: {
                    sessionID: req.sessionID,
                    authenticated: true,
                    cookieSet: true,
                    hasTargetJeeYear: !!(user.targetJeeYear || req.session?.targetJeeYear)
                  }
                };
                
            return res.json(responseData);
          });
        } else {
          console.error('Session object not available after login');
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          // Create response with targetJeeYear from user or null
          const userData = {
            ...userWithoutPassword,
            targetJeeYear: user.targetJeeYear || null
          };
          
          return res.json({
            ...userData,
            debug: {
              error: 'Session object not available',
              authenticated: true,
              cookieSet: false,
              hasTargetJeeYear: !!user.targetJeeYear
            }
          });
        }
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    // Always add debug logs to help troubleshoot authentication issues
    console.log('Auth check | isAuthenticated:', req.isAuthenticated());
    console.log('Auth check | sessionID:', req.sessionID);
    console.log('Auth check | has user object:', !!req.user);
    console.log('Auth check | has cookies:', !!req.headers.cookie);
    console.log('Auth check | origin:', req.headers.origin || 'unknown');
    
    // Add critical headers for secure auth responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    
    if (!req.isAuthenticated()) {
      // Return enhanced error in non-production for debugging
      if (process.env.NODE_ENV !== 'production') {
        return res.status(401).json({ 
          error: "Not authenticated",
          debug: {
            sessionID: req.sessionID || 'none',
            hasCookies: !!req.headers.cookie,
            cookieHeader: req.headers.cookie || 'none'
          }
        });
      }
      
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as any;
    
    // Add targetJeeYear from session if available
    const responseData = {
      ...userWithoutPassword,
      targetJeeYear: req.session?.targetJeeYear || null
    };
    
    // Add debug info for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        ...responseData,
        debug: {
          sessionID: req.sessionID,
          authenticated: true,
          hasTargetJeeYear: !!req.session?.targetJeeYear
        }
      });
    }
    
    return res.json(responseData);
  });

  // Forgot Password - Request Reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      console.log('Forgot password request for email:', email);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal that user doesn't exist for security
        console.log('User not found with email:', email);
        return res.status(200).json({ message: "If a user with that email exists, a password reset link will be sent." });
      }
      
      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set token expiry (1 hour from now)
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Save token to database
      await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
      
      // In a real app, you would send an email here
      // For this exercise, we'll log the reset link to the console
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      console.log('Password reset URL (would be emailed in production):', resetUrl);
      
      return res.status(200).json({
        message: "If a user with that email exists, a password reset link will be sent.",
        // Include the link in development for testing
        ...(process.env.NODE_ENV !== 'production' && { resetUrl })
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  // Reset Password - Verify Token and Update Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      
      console.log('Reset password request with token:', token.substring(0, 10) + '...');
      
      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        console.log('No user found with the provided reset token or token expired');
        return res.status(400).json({ error: "Invalid or expired password reset token" });
      }
      
      // Verify token hasn't expired
      if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        console.log('Token expired. Expiry date was:', user.resetTokenExpiry);
        return res.status(400).json({ error: "Password reset token has expired" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update password and clear reset token
      await storage.updateUserPassword(user.id, hashedPassword);
      
      console.log('Password successfully reset for user:', user.id);
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Authentication required" });
  };

  return { requireAuth };
}