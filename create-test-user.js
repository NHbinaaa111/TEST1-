/**
 * Script to create a test user for development purposes
 * Useful for testing login functionality after database initialization
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

async function createTestUser() {
  console.log('🔄 Starting test user creation process...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    // Check if the users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const usersTableExists = tableCheck.rows[0]?.exists || false;
    if (!usersTableExists) {
      console.error('❌ Users table does not exist! Please run init-db.js first.');
      process.exit(1);
    }
    
    // Check if test user already exists
    const userCheck = await pool.query(`
      SELECT * FROM users WHERE email = 'test@example.com';
    `);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ Test user already exists, no need to create a new one.');
      return;
    }
    
    // Create a test user with a known password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await pool.query(`
      INSERT INTO users (name, email, password, target_jee_year, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW());
    `, ['Test User', 'test@example.com', hashedPassword, '2024']);
    
    console.log('✅ Test user created successfully!');
    console.log('🔑 Email: test@example.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
createTestUser().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});