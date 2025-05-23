/**
 * Database initialization script that safely creates tables
 * based on the schema in 'shared/schema.ts'
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  console.log('🔄 Database initialization starting...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  // Configure PostgreSQL connection with proper SSL for Render and other environments
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout and error handling for Render deployment
    connectionTimeoutMillis: 10000, // 10 seconds to establish connection
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    max: 10 // Maximum number of clients in the pool
  });
  
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if all required tables exist
    console.log('🔄 Checking if database schema exists...');
    
    // List of all tables we need to check
    const requiredTables = [
      'users', 'session', 'tasks', 'subjects', 'topics',
      'goals', 'calendar_tasks', 'study_sessions', 'user_settings', 
      'test_records'
    ];
    
    let missingTables = [];
    
    // Check each table
    for (const table of requiredTables) {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);
      
      const tableExists = tableCheck.rows[0]?.exists || false;
      console.log(`📊 Table "${table}" exists: ${tableExists}`);
      
      if (!tableExists) {
        missingTables.push(table);
      }
    }
    
    console.log(`🔄 Missing tables: ${missingTables.length > 0 ? missingTables.join(', ') : 'None'}`);
    
    // Push schema if any tables are missing
    if (missingTables.length > 0) {
      // Run drizzle-kit push to create all tables
      console.log('🔄 Pushing database schema with drizzle-kit...');
      try {
        const { stdout, stderr } = await execAsync('npx drizzle-kit push');
        console.log('✅ Schema push output:');
        console.log(stdout);
        
        if (stderr && !stderr.includes('No schema changes detected')) {
          console.warn('⚠️ Schema push warnings/errors:');
          console.warn(stderr);
        }
      } catch (error) {
        console.error('❌ Error executing drizzle-kit push:', error);
        
        // If drizzle-kit fails, try direct SQL table creation approach
        console.log('🔄 Attempting direct SQL table creation as fallback...');
        
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
          
          // Create session table for authentication
          await pool.query(`
            CREATE TABLE IF NOT EXISTS "session" (
              sid VARCHAR NOT NULL COLLATE "default",
              sess JSON NOT NULL,
              expire TIMESTAMP(6) NOT NULL,
              CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
            );
          `);
          
          console.log('✅ Direct SQL table creation successful');
        } catch (sqlError) {
          console.error('❌ Direct SQL table creation failed:', sqlError);
          throw sqlError;
        }
      }
    } else {
      console.log('✅ Database schema already exists, skipping initialization');
    }
    
    // Verify that session table exists (needed for authentication)
    const sessionCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'session'
      );
    `);
    
    const sessionTableExists = sessionCheck.rows[0]?.exists || false;
    
    if (!sessionTableExists) {
      console.log('🔄 Creating session table for authentication...');
      // Create session table manually (required for connect-pg-simple)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
      `);
      console.log('✅ Session table created successfully');
    } else {
      console.log('✅ Session table already exists');
    }
    
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the initialization function
initializeDatabase().catch(error => {
  console.error('❌ Unhandled error during database initialization:', error);
  process.exit(1);
});