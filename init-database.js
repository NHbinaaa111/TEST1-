/**
 * Database initialization script
 * This script ensures all database tables are created correctly before starting the application
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import * as schema from './shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Create a Postgres connection
    const connectionString = process.env.DATABASE_URL;
    console.log('Connecting to database...');
    
    // Connection for migrations and queries
    const queryClient = postgres(connectionString);
    const db = drizzle(queryClient, { schema });
    
    console.log('Running database schema push...');
    
    // Push the schema using drizzle-kit via command line
    // This uses the drizzle.config.ts configuration
    try {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      const { stdout, stderr } = await execPromise('npx drizzle-kit push');
      console.log('Schema push output:', stdout);
      
      if (stderr && !stderr.includes('No schema changes detected')) {
        console.error('Schema push stderr:', stderr);
      }
    } catch (error) {
      console.error('Error executing drizzle-kit push:', error);
      throw error;
    }
    
    // Verify that tables exist by performing test queries
    console.log('Verifying database tables...');
    
    try {
      // Test if users table exists
      const usersResult = await queryClient`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `;
      
      const usersTableExists = usersResult[0]?.exists || false;
      console.log(`Users table exists: ${usersTableExists}`);
      
      if (!usersTableExists) {
        console.error('Users table was not created properly. Database schema push failed.');
        process.exit(1);
      }
      
      // Optional: Create a test user for development
      if (process.env.NODE_ENV === 'development') {
        await createTestUser(db);
      }
      
      console.log('Database initialization completed successfully!');
    } catch (error) {
      console.error('Error verifying database tables:', error);
      throw error;
    } finally {
      // Close the connection
      await queryClient.end();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

async function createTestUser(db) {
  try {
    console.log('Creating test user...');
    
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'test@example.com')
    });
    
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.insert(schema.users).values({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      targetJeeYear: '2024'
    });
    
    console.log('Test user created successfully');
  } catch (error) {
    console.error('Error creating test user:', error);
    // Don't throw here, just log the error
  }
}

// Run the initialization
initializeDatabase().catch(error => {
  console.error('Unhandled error during database initialization:', error);
  process.exit(1);
});