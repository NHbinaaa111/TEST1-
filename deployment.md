# Deployment Guide for ChadJEE

This guide provides step-by-step instructions for deploying the ChadJEE application.

## Prerequisites
- Node.js (v16 or later)
- PostgreSQL database
- Git

## Database Setup

The application requires a PostgreSQL database with properly initialized tables. **This step is critical** before starting the backend.

1. Create a PostgreSQL database instance (local or hosted service like Neon Database)
2. Set the following environment variables with your database credentials:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   ```

3. **Initialize the database schema:** This is a crucial step that creates all required tables.
   ```bash
   # Run this command in the project root directory
   node init-database.js
   ```
   
   This script will:
   - Connect to your PostgreSQL database
   - Create all required tables (users, sessions, tasks, etc.)
   - Verify the database structure is correct
   - For development environments, create a test user

## Application Deployment

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd chadjee
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build the application
   ```bash
   npm run build
   ```

4. Start the application
   ```bash
   # Make sure to run the database initialization first!
   node init-database.js
   
   # Then start the application
   npm start
   ```

## Important Notes

- **Always initialize the database before starting the application**. This ensures all required tables exist.
- For development, you can run `node init-database.js && npm run dev` to initialize the database and start the application in one step.
- The initialization script will not overwrite existing data, it only creates tables if they don't exist.

## Troubleshooting

### Authentication Errors

If you encounter authentication errors like:
- "Database setup incomplete. User tables missing."
- "System is currently being updated"

These typically indicate that the database tables weren't properly created. Run:
```bash
node init-database.js
```

### Database Connection Issues

If you encounter database connection issues:
- Verify your DATABASE_URL environment variable is correctly set
- Ensure your PostgreSQL instance is running and accessible
- Check firewall settings if connecting to a remote database

## Additional Configuration

For production deployments, consider setting these additional environment variables:
- `NODE_ENV=production` - Sets application to production mode
- `SESSION_SECRET=your-secure-session-secret` - Secret for session encryption