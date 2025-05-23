import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcrypt';
import * as schema from './shared/schema';

neonConfig.webSocketConstructor = ws;

// Use the DATABASE_URL environment variable
const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });

async function createTestUser() {
  try {
    console.log("Starting test user creation...");
    
    // Hash password using bcrypt (password: "test123")
    const hashedPassword = await bcrypt.hash("test123", 10);
    console.log("Password hashed successfully");
    
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "testuser@example.com")
    });
    
    if (existingUser) {
      console.log("Test user already exists, skipping creation");
      return;
    }
    
    // Create a new test user
    const newUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: hashedPassword
    };
    
    // Insert the user into the database
    const result = await db.insert(schema.users).values(newUser).returning();
    console.log("Test user created successfully:", result[0].id);
    
    // Create default settings for the user
    await db.insert(schema.userSettings).values({
      userId: result[0].id,
      theme: "system",
      accentColor: "blue",
      enableAnimations: true,
      studyHoursGoal: 35,
      pomodoroWorkTime: 25,
      pomodoroBreakTime: 5,
      pomodoroLongBreakTime: 15,
      pomodoroCycles: 4
    });
    
    console.log("User settings created successfully");
    console.log("Test user created with credentials:");
    console.log("Email: testuser@example.com");
    console.log("Password: test123");
    
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

// Run the function
createTestUser()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
  });