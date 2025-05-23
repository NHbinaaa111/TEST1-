/**
 * Render Start Script
 * This script runs before starting the application on Render
 * It ensures the database is properly initialized with retry logic
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Starting Render deployment process...');

// Verify required environment variables for database
if (!process.env.DATABASE_URL) {
  console.error('❌ Required environment variable DATABASE_URL is missing');
  process.exit(1);
}

// Function to retry database initialization with exponential backoff
async function runWithRetry(command, retries = 5, initialDelay = 2000) {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}/${retries}: Running ${command}`);
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Command "${command}" completed successfully`);
      return true;
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        console.error(`❌ All ${retries} attempts failed for command "${command}"`);
        return false;
      }
      
      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(1.5, attempt) * (0.9 + Math.random() * 0.2);
      console.log(`⏱️ Waiting ${Math.round(delay/1000)} seconds before retry...`);
      await setTimeout(delay);
    }
  }
  return false;
}

// Main deployment sequence
(async () => {
  // 1. Run database initialization script with retries
  console.log('🔄 Initializing database...');
  const dbInitSuccess = await runWithRetry('node init-db-esm.js', 5, 3000);
  
  if (!dbInitSuccess) {
    console.error('❌ Database initialization failed after multiple attempts - cannot start application');
    process.exit(1);
  }
  
  console.log('✅ Database initialization completed successfully');
  
  // 2. Start the application
  console.log('🚀 Starting application...');
  try {
    execSync('NODE_ENV=production node dist/index.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    process.exit(1);
  }
})();