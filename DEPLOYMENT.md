# ChadJEE - Render Deployment Guide

This comprehensive guide provides detailed instructions for deploying the ChadJEE application on Render with separate frontend and backend services.

## Overview

ChadJEE requires two services on Render:
1. **Backend Service (Web Service)** - Express API with PostgreSQL database
2. **Frontend Service (Static Site)** - React application

## Prerequisites

1. A Render account
2. A PostgreSQL database on Render (or another provider)

## Database Setup

1. Create a PostgreSQL database on Render
   - Go to the Render Dashboard → New → PostgreSQL
   - Name: `chadjee-db` (or your preferred name)
   - Database: `chadjee` (this will be your PGDATABASE value)
   - User: Keep the default or choose a secure username (this will be your PGUSER value)
   - Region: Choose the closest to your users
   - Plan: Free tier is sufficient for testing; choose a paid tier for production
   - Create Database

2. After creation, note down the following connection details from the database dashboard:
   - **Internal Database URL**: Use this for your backend's DATABASE_URL environment variable
     - ⚠️ **IMPORTANT**: Always use the Internal URL for services running on Render
     - This URL is formatted like: `postgres://user:password@host:port/database`
   - **External Database URL**: Only use for external tools like pgAdmin or for local development
   - **Host**: This will be your PGHOST value (looks like dpg-xxx-a.xxx.postgres.render.com)
   - **User**: This will be your PGUSER value
   - **Password**: This will be your PGPASSWORD value (⚠️ Copy this carefully, you won't see it again)
   - **Database**: This will be your PGDATABASE value (chadjee)
   - **Port**: This will be your PGPORT value (typically 5432)

3. ⚠️ **Database Creation Time**: Note that PostgreSQL databases on Render take approximately 5-10 minutes to fully provision. Wait until the status shows "Available" before attempting to connect.

4. 🔄 **Connection Retries**: The application has been configured with automatic retry logic to handle initial connection delays during first deployment.

## Database Initialization

The application has been configured to automatically create all required database tables on startup. This initialization happens in three ways to ensure maximum reliability:

### Automatic Initialization (No Manual Steps Required)

✅ **This happens automatically during deployment - no manual action needed!**

1. During application startup, the server checks for required database tables
2. If any tables are missing, they are automatically created
3. The system uses multiple fallback methods:
   - First tries `drizzle-kit push` to create tables
   - If that fails, falls back to direct SQL table creation
   - Uses retry logic with exponential backoff to handle connection delays

You'll see logs in the Render dashboard confirming successful initialization:
```
✅ Database initialization completed successfully - Tables synced with database
```

### Optional: Manual Initialization (Only if Needed)

The automatic process should work in most cases. Manual initialization is only needed if you encounter persistent database issues:

#### Using Render Shell

1. After deploying your backend service on Render:
2. Go to your Web Service → Shell
3. Execute the database initialization script:
   ```bash
   node init-db-esm.js
   ```
4. Verify the output shows "Database initialization completed successfully"

#### Using Local Machine

1. Clone the repository to your local machine
2. Install dependencies: `npm install`
3. Configure environment variables (create a `.env` file with your database credentials using the External Database URL)
4. Run: `node init-db-esm.js`

## Backend Deployment

1. Create a Web Service on Render
   - Go to the Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Name: `chadjee-backend` (or your preferred name)
   - **Root Directory**: `.` (the root directory of your project)
   - Environment: Node
   - Region: Same as your database for best performance
   - Branch: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node render-start.js`
   - Instance Type: Free (or paid for production)

   > **⚠️ IMPORTANT**: The special start command `render-start.js` is critical as it ensures:
   > - Database tables are created before the application starts
   > - Connection retries with exponential backoff for better reliability
   > - Proper error handling during initial deployment

2. Set Environment Variables (Required)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Use the **Internal** Database URL from your PostgreSQL database
   - `SESSION_SECRET`: Generate a random string (e.g., `openssl rand -base64 32`)
   - `FRONTEND_URL`: The URL of your frontend service (e.g., `https://chadjee-frontend.onrender.com`)
   - `ALLOWED_ORIGINS`: The URL of your frontend service (comma-separated list if multiple)

3. Set Additional Database Environment Variables (Optional but Recommended)
   - `PGHOST`: PostgreSQL Host from your database settings
   - `PGDATABASE`: Database name (typically `chadjee`)
   - `PGUSER`: Database username
   - `PGPASSWORD`: Database password
   - `PGPORT`: Database port (typically `5432`)

   > **Note**: The additional database variables provide a fallback if DATABASE_URL has connection issues.

4. Advanced Options
   - Set Auto-Deploy to Yes
   - Health Check Path: `/api/debug/auth`
   - Under "More Settings", consider selecting "Use Private Networking" for secure internal communication with your database

5. Initial Deployment
   - After clicking "Create Web Service", monitor the deployment logs
   - Watch for confirmation that database tables were created successfully
   - You should see: `✅ Database initialization completed successfully - Tables synced with database`
   - The first deployment may take longer (5-10 minutes) as it builds and sets up the database

## Frontend Deployment

1. Create a Static Site on Render
   - Go to the Render Dashboard → New → Static Site
   - Connect your GitHub repository
   - Name: `chadjee-frontend` (or your preferred name)
   - **Root Directory**: `.` (the root directory of your project)
   - Branch: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - Region: Same as your backend service

2. Set Environment Variables (Required)
   - `VITE_API_URL`: The URL of your backend service (e.g., `https://chadjee-backend.onrender.com`)
   
   > ⚠️ **CRITICAL**: This variable must include the full URL with `https://` prefix. It's embedded during build time and cannot be changed without rebuilding.

3. Deployment Order Best Practices
   - **Deploy backend first**, then frontend
   - If you deployed the frontend first, you'll need to:
     1. Get your backend URL after deploying the backend service
     2. Update the `VITE_API_URL` environment variable in the frontend
     3. Trigger a manual redeploy of the frontend
   
4. Verify Successful Deployment
   - After deployment completes, visit your frontend URL
   - The site should load without any console errors related to API connections
   - Test user registration and login
   - If authentication doesn't work, check CORS configuration and review the Troubleshooting section below

## Post-Deployment Configuration

After both services are deployed:

1. Update environment variables with actual URLs (if you used placeholders earlier)
   - In the backend service: 
     - Go to your backend service → Environment
     - Update `ALLOWED_ORIGINS` and `FRONTEND_URL` with your actual frontend URL
     - Include the full URL with `https://` prefix (e.g., `https://chadjee-frontend.onrender.com`)
   - In the frontend service:
     - Go to your frontend service → Settings
     - Update `VITE_API_URL` with your actual backend URL
     - Include the full URL with `https://` prefix (e.g., `https://chadjee-backend.onrender.com`)

2. Trigger a manual deploy of both services to apply the updated environment variables
   - For the backend: Go to your backend service and click **Manual Deploy** → **Deploy latest commit**
   - For the frontend: Go to your frontend service and click **Manual Deploy** → **Deploy latest commit**
   - Wait for both services to complete deployment (~3-5 minutes each)

3. Verify the connection with these steps:
   - Visit your frontend URL in an incognito window (to avoid cached issues)
   - Test user registration with a new account
   - Test login with your newly created account
   - Verify that you remain logged in when refreshing the page
   - Confirm that dashboard data loads correctly
   - Access `/api/debug/auth` on the backend service to verify authentication status
     - Example: `https://chadjee-backend.onrender.com/api/debug/auth`
     - After logging in, this should show: `{"authenticated":true,"sessionID":"...","user":{...},"cookies":true}`

## Cross-Origin Configuration and API Communication

To ensure proper communication between frontend and backend services:

1. **Backend CORS Configuration**
   - The application is already configured to use the `ALLOWED_ORIGINS` environment variable
   - Make sure your backend's `ALLOWED_ORIGINS` includes the exact URL of your frontend (including `https://` prefix)
   - Example: `https://chadjee-frontend.onrender.com`

2. **Frontend API Configuration**
   - The frontend uses `VITE_API_URL` to connect to the backend
   - This value is embedded during build time, so if you change it, you need to rebuild the frontend

## Troubleshooting

### Authentication Issues

If users cannot log in or stay logged in:

1. **CORS Configuration**
   - Check browser console for CORS errors (red error messages with "Access-Control-Allow-Origin")
   - Verify that `ALLOWED_ORIGINS` in backend contains the exact frontend URL with:
     - Correct protocol (`https://`)
     - No trailing slash at the end
     - No typos in the domain name
   - If you see: `Access to fetch at 'https://backend.url' from origin 'https://frontend.url' has been blocked by CORS policy`, your CORS configuration needs fixing

2. **Cookie Problems**
   - Check Application tab in Chrome DevTools → Storage → Cookies
   - You should see cookies with the domain of your backend service
   - Look for `connect.sid` cookie - this is the session cookie
   - If missing, test `/api/debug/auth` on the backend to see detailed debugging information

3. **Environment Variables**
   - Verify that DATABASE_URL is correctly set in the backend service
   - Confirm VITE_API_URL is correctly set in the frontend service
   - Check that SESSION_SECRET is set in the backend service

4. **SameSite Cookie Issues**
   - If you see `{"authenticated":false,"sessionID":"...","user":null,"cookies":false}` when accessing `/api/debug/auth`
   - This indicates a SameSite cookie issue (application is configured correctly but browsers may block cookies)
   - Ensure you're using secure HTTPS URLs for both frontend and backend
   - Try accessing the site in an incognito window (which may have different cookie policies)

### Database Problems

If you encounter database-related errors:

1. **"Relation does not exist" errors**
   - Wait 5-10 minutes after initial deployment (tables are created automatically)
   - Check the Render logs for database initialization messages
   - If tables weren't created automatically, use the Shell option to run `node init-db-esm.js`

2. **Connection Issues**
   - Verify the database service is "Available" in Render dashboard
   - Confirm you're using the Internal Database URL (not External)
   - Check Render logs for any PostgreSQL connection errors

3. **Data Not Saving**
   - Verify database write permissions (free Render PostgreSQL databases have limited storage)
   - Test by creating a simple user account and checking logs

### Step-by-Step Debugging Guide

If you're still experiencing issues:

1. **Reset and Verify Backend**
   - Go to Backend service → Shell
   - Run: `node init-db-esm.js` to ensure database tables exist
   - Check logs for any errors
   - Test direct API access: `https://your-backend.onrender.com/api/debug/auth`

2. **Reset and Verify Frontend**
   - Trigger a manual redeploy after confirming backend works
   - Open browser dev tools (F12) → Network tab
   - Check that API requests to your backend have:
     - Status 200 (not 401, 403, or CORS errors)
     - Request includes `credentials: 'include'`
     - Response includes session cookies
   
3. **Last Resort**
   - Check the debug-auth.js script in the repository for additional debugging options
   - You can run: `node debug-auth.js https://your-backend.onrender.com https://your-frontend.onrender.com`
   - This will diagnose specific cross-domain authentication issues

## Database Persistence and Management

When working with PostgreSQL on Render:

1. **Free Tier Limitations**
   - Free PostgreSQL databases on Render have limited storage (1GB)
   - Data is automatically persisted and survives restarts/deployments
   - No automatic backups on free tier (paid tiers include backups)

2. **Database Maintenance**
   - Render automatically handles PostgreSQL updates and security patches
   - You can connect to the database using the External URL with tools like:
     - pgAdmin
     - DBeaver
     - TablePlus
     - Or the Render Web Shell: `psql $DATABASE_URL`

3. **Data Retention**
   - Free tier databases are suspended after 90 days of inactivity
   - To prevent this, set up a simple health check that queries the database periodically

4. **Scaling for Production**
   - For real production use, consider upgrading to a paid database plan
   - Paid plans offer more storage, better performance, and automatic backups
   - You can easily scale up without changing your application code

## Maintenance and Monitoring

For ongoing maintenance of your deployed application:

1. **Health Checks**
   - Render provides automatic health checks for web services
   - Configure health check path to `/api/debug/auth` for the backend service
   - Set health check interval to 2 minutes (default)

2. **Logs and Monitoring**
   - Monitor application logs from the Render dashboard
   - Set up log drains for persistent log storage if needed
   - Check metrics for resource usage to determine if you need to scale up

3. **Regular Updates**
   - Keep dependencies updated with security patches
   - Test changes locally before deploying to production
   - Use Render's preview environments for testing changes before deployment

## Final Checklist

Before considering your deployment complete, verify the following:

- [ ] Database has been created and is showing as "Available" in Render
- [ ] Backend service has been deployed with all required environment variables
- [ ] Database tables have been automatically created during deployment
- [ ] Frontend service has been deployed with correct API URL
- [ ] User registration works successfully
- [ ] User login works and maintains session on page refresh
- [ ] All critical application features are working correctly
- [ ] Security configurations (CORS, cookies, authentication) are properly set

Congratulations! Your ChadJEE application should now be fully deployed and functional on Render!
   - You'll see logs confirming "Tables synced with database" when startup completes
   - This works in both development (Replit) and production (Render) environments

2. **Database Schema Synchronization**:
   - The system checks for all required tables during startup
   - Missing tables are automatically created based on the schema in `shared/schema.ts`
   - The initialization process includes fallbacks that ensure tables are always created properly
   - This eliminates errors like "Database setup incomplete" or "relation does not exist"

3. **Creating Test Users**:
   - For development environments, you can create a test user with:
     ```bash
     node create-test-user.js
     ```
   - This creates a user with email: test@example.com and password: password123

4. **Backup Strategy**: 
   - Render provides automatic backups depending on your database plan
   - For paid plans, you can configure daily backups

5. **Connection Pooling**:
   - The application uses connection pooling via the `pool` configuration in server/db.ts
   - This efficiently manages database connections in production

## Environment Variables Reference

### Backend

| Variable          | Description                              | Example                               |
|-------------------|------------------------------------------|---------------------------------------|
| NODE_ENV          | Environment (always 'production')        | `production`                          |
| DATABASE_URL      | PostgreSQL connection string             | `postgres://user:pass@host:port/db`   |
| PGHOST            | PostgreSQL host                          | `dpg-xxx-a.xxx.postgres.render.com`   |
| PGDATABASE        | Database name                            | `chadjee`                             |
| PGUSER            | Database username                        | `chadjee_user`                        |
| PGPASSWORD        | Database password                        | `your-password`                       |
| PGPORT            | Database port                            | `5432`                                |
| SESSION_SECRET    | Secret for session encryption            | `random-string-here`                  |
| FRONTEND_URL      | URL of frontend service                  | `https://chadjee-frontend.onrender.com` |
| ALLOWED_ORIGINS   | Frontend URL(s), comma-separated         | `https://chadjee-frontend.onrender.com` |

### Frontend

| Variable       | Description                    | Example                               |
|----------------|--------------------------------|---------------------------------------|
| VITE_API_URL   | URL of the backend service     | `https://chadjee-backend.onrender.com` |

## Important Files and Configuration

The following files contain critical configuration for cross-domain authentication:

- `server/auth.ts` - Session and cookie configuration. Already configured with proper `sameSite: 'none'`, `secure: true` and other important security settings for production.
  
- `server/index.ts` - CORS settings. Already configured to properly handle cross-origin requests using the `ALLOWED_ORIGINS` environment variable.

- `client/src/lib/queryClient.ts` - Centralized fetch utilities that ensure all API calls include `credentials: 'include'` for proper authentication.

## Scaling Considerations

As your user base grows:

1. **Upgrade Database Plan**: Move from free to paid tiers for better performance and reliability

2. **Upgrade Web Service**: Increase compute resources for your backend service

3. **Content Delivery**: Consider using a CDN for static assets

4. **Database Optimization**: Implement query optimizations and proper indexing