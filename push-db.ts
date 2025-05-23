import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const runMigration = async () => {
  console.log('Initializing database with schema...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Create a Postgres connection
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    
    // Simple test query to verify connection
    console.log('Testing database connection...');
    const testQuery = await client`SELECT NOW()`;
    console.log(`Connected to database, current time: ${testQuery[0].now}`);
    
    // Push schema directly using SQL queries
    console.log('Pushing schema to database...');
    
    // Execute SQL queries to create each table in the correct order
    // Create enums first
    console.log('Creating enums...');
    const enums = [
      `CREATE TYPE IF NOT EXISTS "color" AS ENUM ('blue', 'green', 'purple', 'red')`,
      `CREATE TYPE IF NOT EXISTS "theme" AS ENUM ('dark', 'light', 'system')`,
      `CREATE TYPE IF NOT EXISTS "task_status" AS ENUM ('todo', 'in_progress', 'completed')`,
      `CREATE TYPE IF NOT EXISTS "goal_type" AS ENUM ('weekly', 'monthly')`,
      `CREATE TYPE IF NOT EXISTS "mood" AS ENUM ('terrible', 'bad', 'neutral', 'good', 'excellent')`,
      `CREATE TYPE IF NOT EXISTS "energy" AS ENUM ('exhausted', 'tired', 'normal', 'energized', 'supercharged')`,
      `CREATE TYPE IF NOT EXISTS "test_performance" AS ENUM ('excellent', 'good', 'average', 'poor')`
    ];
    
    for (const enumSql of enums) {
      try {
        await client.unsafe(enumSql);
        console.log(`Created enum: ${enumSql.split(' ')[4]}`);
      } catch (error) {
        console.error(`Error creating enum: ${error.message}`);
      }
    }
    
    // Create tables in order of dependencies
    console.log('Creating tables...');
    const tables = [
      // Users table first
      {
        name: "users",
        sql: `CREATE TABLE IF NOT EXISTS "users" (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          target_jee_year TEXT
        )`
      },
      
      // Then tables that depend on users
      {
        name: "tasks",
        sql: `CREATE TABLE IF NOT EXISTS "tasks" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE NOT NULL,
          date DATE NOT NULL,
          subject TEXT,
          subject_color "color",
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      {
        name: "subjects",
        sql: `CREATE TABLE IF NOT EXISTS "subjects" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          progress REAL DEFAULT 0 NOT NULL,
          color "color" NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      {
        name: "goals",
        sql: `CREATE TABLE IF NOT EXISTS "goals" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE NOT NULL,
          deadline DATE NOT NULL,
          type "goal_type" NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      {
        name: "calendar_tasks",
        sql: `CREATE TABLE IF NOT EXISTS "calendar_tasks" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          subject TEXT NOT NULL,
          subject_color "color" NOT NULL,
          title TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      {
        name: "study_sessions",
        sql: `CREATE TABLE IF NOT EXISTS "study_sessions" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          task_name TEXT NOT NULL,
          subject TEXT DEFAULT 'General Study',
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          duration INTEGER NOT NULL,
          date DATE NOT NULL,
          mood "mood",
          energy "energy",
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      {
        name: "user_settings",
        sql: `CREATE TABLE IF NOT EXISTS "user_settings" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          theme "theme" DEFAULT 'system' NOT NULL,
          accent_color "color" DEFAULT 'blue' NOT NULL,
          enable_animations BOOLEAN DEFAULT TRUE NOT NULL,
          study_hours_goal INTEGER DEFAULT 35 NOT NULL,
          pomodoro_work_time INTEGER DEFAULT 25 NOT NULL,
          pomodoro_break_time INTEGER DEFAULT 5 NOT NULL,
          pomodoro_long_break_time INTEGER DEFAULT 15 NOT NULL,
          pomodoro_cycles INTEGER DEFAULT 4 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          CONSTRAINT user_settings_user_id_idx UNIQUE (user_id)
        )`
      },
      
      {
        name: "test_records",
        sql: `CREATE TABLE IF NOT EXISTS "test_records" (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          date DATE NOT NULL,
          subject TEXT NOT NULL,
          sub_topic TEXT,
          marks_obtained INTEGER NOT NULL,
          marks_total INTEGER NOT NULL,
          performance "test_performance" NOT NULL,
          areas_to_improve TEXT[],
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      // Tables that depend on subjects
      {
        name: "topics",
        sql: `CREATE TABLE IF NOT EXISTS "topics" (
          id SERIAL PRIMARY KEY,
          subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      },
      
      // Session table for authentication
      {
        name: "session",
        sql: `CREATE TABLE IF NOT EXISTS "session" (
          sid VARCHAR NOT NULL PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        )`
      },
      
      // Create index on session.expire
      {
        name: "session_index",
        sql: `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`
      }
    ];
    
    for (const table of tables) {
      try {
        await client.unsafe(table.sql);
        console.log(`Created table: ${table.name}`);
      } catch (error) {
        console.error(`Error creating table ${table.name}: ${error.message}`);
      }
    }
    
    console.log('Database schema has been successfully pushed!');
    
    // Close the connection
    await client.end();
    console.log('Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error pushing schema to database:', error);
    process.exit(1);
  }
};

// Run the migration
runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});