# ChadJEE Deployment Checklist

Use this checklist to verify your application is ready for deployment to Render.

## Frontend Checks

- [ ] All API calls use centralized configuration
  - [ ] `getApiUrl()` for URL construction
  - [ ] `getDefaultFetchOptions()` or `apiRequest()` for fetch options
  - [ ] `credentials: 'include'` is set for all fetch calls

- [ ] Environment variables
  - [ ] `VITE_API_URL` is configured to point to backend service
  - [ ] No hardcoded API URLs exist in the code

- [ ] Authentication
  - [ ] Login/register/logout functions use correct error handling
  - [ ] Protected routes are properly implemented

## Backend Checks

- [ ] CORS configuration
  - [ ] `ALLOWED_ORIGINS` environment variable is used
  - [ ] `credentials: true` is enabled
  - [ ] Origin validation is working properly

- [ ] Session/cookie settings
  - [ ] `secure: true` in production
  - [ ] `sameSite: 'none'` in production
  - [ ] `SESSION_SECRET` environment variable is set

- [ ] Database configuration
  - [ ] `DATABASE_URL` environment variable is set
  - [ ] Schema is pushed to the database
  - [ ] Connection pool is correctly configured

- [ ] Error handling
  - [ ] Global error handler is in place
  - [ ] Proper status codes are returned
  - [ ] Error messages are user-friendly

## Deployment Steps

1. **Database**
   - [ ] Create PostgreSQL database on Render
   - [ ] Note connection details

2. **Backend**
   - [ ] Create Web Service on Render
   - [ ] Set required environment variables
   - [ ] Enable health check path
   - [ ] Verify server starts properly

3. **Frontend**
   - [ ] Create Static Site on Render
   - [ ] Set `VITE_API_URL` environment variable
   - [ ] Verify build process completes

4. **Post-Deployment**
   - [ ] Update `ALLOWED_ORIGINS` with actual frontend URL
   - [ ] Test cross-domain authentication
   - [ ] Verify all API endpoints work

## Common Issues

- Session cookies not being set
  - Check `sameSite` and `secure` settings
  - Verify HTTPS is being used

- CORS errors
  - Check allowed origins list
  - Ensure credentials mode is enabled

- Authentication failures
  - Test `/api/debug/auth` endpoint
  - Check browser cookies are being set

- Database connectivity
  - Verify connection string format
  - Check network access settings

## Validation Tests

Run these tests after deployment to verify everything is working:

1. Register a new user
2. Log in with the new user
3. Create a task
4. Verify task appears in the dashboard
5. Log out
6. Log back in and confirm data persists