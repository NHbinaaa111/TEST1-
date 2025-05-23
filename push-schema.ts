/**
 * Script to push the database schema to PostgreSQL
 * Run with: npm run db:push
 */

import { exec } from 'child_process';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import * as schema from './shared/schema';

// Log current environment
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database URL: ${process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set'}`);

// Push the schema using drizzle-kit
exec('drizzle-kit push', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing drizzle-kit push: ${error.message}`);
    return;
  }
  
  console.log('Schema pushed successfully:');
  console.log(stdout);
  
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  
  // Now create a test user for development/testing
  createTestUser().catch(console.error);
});

// Create a test user for development
async function createTestUser() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set');
      return;
    }
    
    // Connect to the database
    const queryClient = postgres(databaseUrl, { max: 1 });
    const db = drizzle(queryClient, { schema });
    
    // Check if test user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'test@example.com')
    });
    
    if (existingUser) {
      console.log('Test user already exists, skipping creation');
      queryClient.end();
      return;
    }
    
    // Create a test user with properly hashed password using bcrypt
    const hashedPassword = await bcrypt.hash("password", 10);
    
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword, // "password" hashed with bcrypt
    };
    
    await db.insert(schema.users).values(testUser);
    console.log('Test user created successfully');
    
    // Create default settings for the test user
    const createdUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'test@example.com')
    });
    
    if (createdUser) {
      await db.insert(schema.userSettings).values({
        userId: createdUser.id,
        theme: 'system',
        accentColor: 'blue',
        enableAnimations: true,
        studyHoursGoal: 35,
        pomodoroWorkTime: 25,
        pomodoroBreakTime: 5,
        pomodoroLongBreakTime: 15,
        pomodoroCycles: 4
      });
      console.log('Default settings created for test user');
    }
    
    queryClient.end();
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}