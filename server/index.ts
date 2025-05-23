import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { pool, db } from "./db";
import * as schema from "../shared/schema";

// Initialize the database function
async function initializeDatabase() {
  try {
    log('🔄 Initializing database and checking tables...');
    
    // Check if required tables exist
    const requiredTables = [
      'users', 'tasks', 'subjects', 'topics', 'goals', 'calendar_tasks', 
      'study_sessions', 'user_settings', 'test_records', 'session'
    ];
    
    const missingTables = [];
    
    // Check which tables exist and which are missing
    for (const table of requiredTables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = $1
          );
        `, [table]);
        
        const exists = result.rows[0]?.exists || false;
        if (!exists) {
          missingTables.push(table);
        }
      } catch (error) {
        console.error(`Error checking for table ${table}:`, error);
        missingTables.push(table); // Assume it's missing if there's an error
      }
    }
    
    // If all tables exist, we can skip initialization
    if (missingTables.length === 0) {
      log('✅ All required database tables already exist');
      return;
    }
    
    // Log which tables are missing
    log(`🔄 Missing tables detected: ${missingTables.join(', ')}`);
    log('🔄 Creating missing database tables...');
    
    // Create all tables directly using SQL from our schema
    try {
      // First create enums
      await pool.query(`
        DO $$ 
        BEGIN
          -- Create enums if they don't exist
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'color') THEN
            CREATE TYPE color AS ENUM ('blue', 'green', 'purple', 'red');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme') THEN
            CREATE TYPE theme AS ENUM ('dark', 'light', 'system');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
            CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_type') THEN
            CREATE TYPE goal_type AS ENUM ('weekly', 'monthly');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood') THEN
            CREATE TYPE mood AS ENUM ('terrible', 'bad', 'neutral', 'good', 'excellent');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'energy') THEN
            CREATE TYPE energy AS ENUM ('exhausted', 'tired', 'normal', 'energized', 'supercharged');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_performance') THEN
            CREATE TYPE test_performance AS ENUM ('excellent', 'good', 'average', 'poor');
          END IF;
        END $$;
      `);
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          target_jee_year TEXT
        );
      `);
      
      // Create sessions table for authentication
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          sid TEXT PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP NOT NULL
        );
      `);
      
      // Create tasks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          date DATE NOT NULL,
          subject TEXT,
          subject_color color,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // Create subjects table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS subjects (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          progress REAL NOT NULL DEFAULT 0,
          color color NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // Create topics table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS topics (
          id SERIAL PRIMARY KEY,
          subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // Create goals table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          deadline DATE NOT NULL,
          type goal_type NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // Create calendar_tasks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS calendar_tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          subject TEXT NOT NULL,
          subject_color color NOT NULL,
          title TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // Create study_sessions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS study_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_name TEXT NOT NULL,
          subject TEXT DEFAULT 'General Study',
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          duration INTEGER NOT NULL,
          date DATE NOT NULL,
          mood mood,
          energy energy,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // Create user_settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          theme theme NOT NULL DEFAULT 'system',
          accent_color color NOT NULL DEFAULT 'blue',
          enable_animations BOOLEAN NOT NULL DEFAULT true,
          study_hours_goal INTEGER NOT NULL DEFAULT 35,
          pomodoro_work_time INTEGER NOT NULL DEFAULT 25,
          pomodoro_break_time INTEGER NOT NULL DEFAULT 5,
          pomodoro_long_break_time INTEGER NOT NULL DEFAULT 15,
          pomodoro_cycles INTEGER NOT NULL DEFAULT 4,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          CONSTRAINT user_settings_user_id_idx UNIQUE (user_id)
        );
      `);
      
      // Create test_records table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_records (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          date DATE NOT NULL,
          subject TEXT NOT NULL,
          sub_topic TEXT,
          marks_obtained INTEGER NOT NULL,
          marks_total INTEGER NOT NULL,
          performance test_performance NOT NULL,
          areas_to_improve TEXT[],
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      log('✅ All database tables created successfully');
    } catch (error) {
      console.error('❌ Error creating database tables:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1); // Exit if we can't initialize the database
  }
}

// We need to ensure the database is initialized before starting the application
(async () => {
  try {
    console.log('🚀 Starting database initialization...');
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully - Tables synced with database');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
})();

const app = express();

// Configure CORS for cross-origin requests
// IMPORTANT DEPLOYMENT NOTE: 
// When deployed to Render, the frontend and backend should be different services.
// The frontend will make CORS requests to the backend with credentials (cookies).
// These settings ensure that:
// 1. Only trusted domains can access the API
// 2. Credentials (cookies) are properly sent and accepted
// 3. Necessary headers are allowed for proper functioning

// Allow specific domains based on environment
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Primary allowed origins - must include your frontend URL(s)
    const primaryDomains = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(domain => domain.trim())
      : [
          // Default allowed origins - MAKE SURE YOUR FRONTEND URL IS LISTED HERE
          'https://chadjee.onrender.com',
          'https://www.chadjee.onrender.com',
          'https://chadjee-frontend.onrender.com',
          'https://chadjee-app.onrender.com'
        ];
    
    // Log the allowed origins for debugging
    console.log('Allowed origins in production:', primaryDomains);
    
    // Allow other Render subdomains for testing and development
    // CRITICAL: This is more permissive but helps avoid CORS issues during development
    const renderDomainPattern = /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/;
    
    return {
      // This function validates origin against allowed domains
      // Returns the origin if allowed, or false if not allowed
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
        // Allow requests with no origin (like mobile apps, curl requests, etc.)
        if (!origin) {
          console.log('Request has no origin, allowing for non-browser clients');
          return callback(null, true);
        }
        
        // Check if the origin exactly matches one of our primary domains
        if (primaryDomains.includes(origin)) {
          console.log(`✓ Origin ${origin} is explicitly allowed`);
          return callback(null, origin);
        }
        
        // More permissive check for Render domains during testing
        if (renderDomainPattern.test(origin)) {
          console.log(`✓ Origin ${origin} allowed via Render domain pattern`);
          return callback(null, origin);
        }
        
        // Enable localhost during development on Render
        if (origin.startsWith('http://localhost:')) {
          console.log(`✓ Allowing localhost origin: ${origin}`);
          return callback(null, origin);
        }
        
        // Enhanced debug logging for CORS issues
        console.error(`✗ Origin ${origin} denied - not in allowed list`);
        console.error('Allowed origins:', primaryDomains);
        console.error(`To fix: Add "${origin}" to ALLOWED_ORIGINS environment variable`);
        
        // In production, we'd deny this origin, but during development/testing
        // we'll allow it with a warning to help with troubleshooting
        if (process.env.NODE_ENV === 'production') {
          // Origin is not allowed - return specific error
          callback(new Error(`CORS error: ${origin} is not allowed by server configuration`));
        } else {
          console.warn(`WARNING: Allowing unauthorized origin ${origin} for testing purposes`);
          callback(null, origin);
        }
      },
      credentials: true, // REQUIRED for cookies/authentication across origins
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Auth-Token'],
      exposedHeaders: ['Set-Cookie', 'Date', 'Cache-Control', 'Content-Language'], // Expose critical headers
      maxAge: 86400, // Cache preflight requests for 24 hours
      optionsSuccessStatus: 204 // Some legacy browsers choke on 204
    };
  } else {
    // Development environment - use more permissive configuration
    return {
      // Allow both localhost and Replit preview URL
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
        console.log(`Development mode: allowing origin ${origin || 'unknown'}`);
        callback(null, origin || '*');
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Auth-Token'],
      exposedHeaders: ['Set-Cookie', 'Date', 'Cache-Control', 'Content-Language']
    };
  }
};

const corsOptions = getAllowedOrigins();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Set up authentication before routes
  const { requireAuth } = setupAuth(app);
  
  // Debug endpoint to check auth status - helps with deployment troubleshooting
  // Always enable this for better debugging during deployment
  app.get("/api/debug/auth", (req, res) => {
    // Add more detailed debug information to help troubleshoot authentication issues
    const cookieHeader = req.headers.cookie || '';
    
    // Parse cookies to show partial info without revealing sensitive data
    const cookies = cookieHeader.split(';')
      .map(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        return {
          name,
          // Only include partial values for non-sensitive cookies
          value: name.includes('connect.sid') || name.includes('session') 
            ? '***[Session Cookie Present]***'
            : rest.join('=').substring(0, 3) + '...',
          httpOnly: false, // Can't detect this from request
        };
      });

    res.json({
      authenticated: req.isAuthenticated(),
      sessionID: req.sessionID ? req.sessionID.substring(0, 6) + '...' : null,
      user: req.user ? { id: (req.user as any).id } : null,
      cookies: cookies,
      cookieCount: cookies.length,
      hasCookieHeader: !!req.headers.cookie,
      hasSessionCookie: cookieHeader.includes('connect.sid'),
      origin: req.headers.origin || 'not provided',
      userAgent: req.headers['user-agent'],
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
      corsEnabled: true
    });
    
    // Log session information on the server side
    console.log('Debug Auth Request | Session ID:', req.sessionID);
    console.log('Debug Auth Request | Authenticated:', req.isAuthenticated());
    console.log('Debug Auth Request | Has Session Object:', !!req.session);
    console.log('Debug Auth Request | Cookie Header:', !!req.headers.cookie);
  });
  
  // Register routes with auth middleware
  const server = await registerRoutes(app, requireAuth);

  // Global error handler with improved logging and response formatting
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    // Determine appropriate status code
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Additional error details (only included in development)
    const errorDetails = process.env.NODE_ENV !== 'production' ? {
      stack: err.stack,
      path: req.path,
      method: req.method
    } : undefined;
    
    // Production vs development error responses
    const errorResponse = process.env.NODE_ENV === 'production' 
      ? { error: message, success: false }
      : { error: message, success: false, details: errorDetails };
    
    // Enhanced error logging in production
    if (process.env.NODE_ENV === 'production') {
      console.error(`[ERROR] ${status} ${req.method} ${req.path} - ${message}`);
      // Log extra details that might help debugging while keeping sensitive info out of responses
      console.error(`Request IP: ${req.ip}`);
      console.error(`Request headers: ${JSON.stringify(req.headers)}`);
      console.error(`Error stack: ${err.stack}`);
    } else {
      console.error(err);
    }
    
    res.status(status).json(errorResponse);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
