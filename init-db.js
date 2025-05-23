/**
 * Database initialization script that safely creates tables
 * based on the schema in 'shared/schema.ts'
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

async function initializeDatabase() {
  console.log('🔄 Database initialization starting...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    console.log('🔄 Checking if database schema exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const usersTableExists = tableCheck.rows[0]?.exists || false;
    console.log(`📊 Users table exists: ${usersTableExists}`);
    
    // Run drizzle-kit push to create all tables
    console.log('🔄 Pushing database schema with drizzle-kit...');
    try {
      // Use the right command format for drizzle-kit
      console.log('Running drizzle-kit push...');
      const { stdout, stderr } = await execAsync('npx drizzle-kit push');
      console.log('✅ Schema push output:');
      console.log(stdout);
      
      if (stderr && !stderr.includes('No schema changes detected')) {
        console.warn('⚠️ Schema push warnings/errors:');
        console.warn(stderr);
      }
    } catch (error) {
      console.error('❌ Error executing drizzle-kit push:', error.message);
      
      // If drizzle-kit fails, try direct SQL table creation approach
      console.log('Attempting direct SQL table creation as fallback...');
      
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
        
        // Create users table with minimum required fields
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
        console.error('❌ Direct SQL table creation also failed:', sqlError.message);
        throw sqlError; // This will be caught by the outer try/catch
      }
    }
    
    // Verify that users table was created
    const verifyTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const tableCreated = verifyTable.rows[0]?.exists || false;
    if (!tableCreated) {
      console.error('❌ Users table was not created! Schema push failed.');
      process.exit(1);
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
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
      `);
      console.log('✅ Session table created successfully');
    } else {
      console.log('✅ Session table already exists');
    }
    
    // Verify all required enums exist
    console.log('🔄 Verifying required PostgreSQL enums...');
    const requiredEnums = ['color', 'theme', 'task_status', 'goal_type', 'mood', 'energy', 'test_performance'];
    
    for (const enumName of requiredEnums) {
      const enumCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = $1
        );
      `, [enumName]);
      
      const enumExists = enumCheck.rows[0]?.exists || false;
      if (!enumExists) {
        console.error(`❌ Required enum '${enumName}' does not exist! Schema push incomplete.`);
      } else {
        console.log(`✅ Enum '${enumName}' exists`);
      }
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