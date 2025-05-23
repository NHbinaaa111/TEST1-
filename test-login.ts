import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcrypt';
import * as schema from './shared/schema';

neonConfig.webSocketConstructor = ws;

// Use the DATABASE_URL environment variable
const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });

async function testLogin() {
  try {
    console.log("Testing login functionality...");
    
    // Fetch user from database
    const email = "testuser@example.com";
    const password = "test123";
    
    console.log(`Attempting to log in with email: ${email}`);
    
    // Find the user by email
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email)
    });
    
    if (!user) {
      console.log("Login failed: User not found");
      return;
    }
    
    console.log("User found in database:", user.id);
    
    // Compare password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (passwordMatch) {
      console.log("Login successful! Password matches.");
      console.log("User details:", {
        id: user.id,
        name: user.name,
        email: user.email
      });
    } else {
      console.log("Login failed: Password does not match");
    }
  } catch (error) {
    console.error("Error testing login:", error);
  }
}

// Run the function
testLogin()
  .then(() => {
    console.log("Login test completed");
    process.exit(0);
  })
  .catch(err => {
    console.error("Login test failed:", err);
    process.exit(1);
  });