import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with explicit error handling for better stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client can remain idle before being closed
  connectionTimeoutMillis: 5000 // How long to wait for a connection to be established
});

// Log successful database connection
pool.on('connect', () => {
  console.log('Database connection established');
});

// Handle database errors to prevent application crashes
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't crash the server on connection errors
});

export const db = drizzle(pool, { schema });