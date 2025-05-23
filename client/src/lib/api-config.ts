// API Configuration
// This file handles API endpoint configuration for different environments

/**
 * Determines the base API URL based on the current environment
 * In production: Uses the VITE_API_URL environment variable or falls back to a specific URL
 * In development: Uses an empty string for relative URLs (handled by Vite proxy)
 */
export const getBaseApiUrl = (): string => {
  // For production deployed on Render
  if (import.meta.env.PROD) {
    // Use environment variable for the backend URL
    // IMPORTANT: This should be set in the Render dashboard or .env.production file
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (!apiUrl) {
      console.error('CRITICAL ERROR: VITE_API_URL environment variable is not set!');
      console.error('Without this, the app cannot connect to the backend API.');
      console.error('Please set VITE_API_URL in your Render dashboard for the frontend service.');
      
      // Log detailed information about the current environment to help debugging
      console.info('Current hostname:', window.location.hostname);
      console.info('Current origin:', window.location.origin);
      
      // Try to alert the user if we're in the browser
      if (typeof window !== 'undefined') {
        window.alert('API URL configuration error. Please contact the administrator.');
      }
      
      // Last-resort fallback URLs - try all the common patterns for Render deployments
      // NOTE: This is really just to help with debugging, not a proper solution
      const hostname = window.location.hostname;
      let rootDomain = '';
      
      // Handle different hosting platforms
      if (hostname.endsWith('.onrender.com')) {
        rootDomain = hostname.split('.').slice(-3).join('.');
      } else if (hostname.endsWith('.replit.dev') || hostname.endsWith('.repl.co')) {
        // Handle Replit domains
        rootDomain = hostname;
      } else {
        rootDomain = hostname;
      }
      
      // Attempt to guess the backend domain with common patterns
      const possibleBackendUrls = [
        // First check if backend is same-origin
        window.location.origin,
        
        // Preferred pattern - api subdomain on same root
        `https://api.${rootDomain}`,
        
        // Common patterns for API backend on Render
        `https://${hostname.split('.')[0]}-api.onrender.com`,
        `https://${hostname.split('.')[0]}-backend.onrender.com`,
        `https://${hostname.split('.')[0]}-server.onrender.com`,
        
        // Common patterns for Replit
        `https://${hostname.split('-')[0]}-api.${hostname.split('.').slice(-2).join('.')}`,
        
        // Fallback in case frontend is on a custom subdomain
        'https://chadjee-api.onrender.com'
      ];
      
      console.warn('Attempting to guess backend URL from these possibilities:', possibleBackendUrls);
      console.warn('First URL will be used:', possibleBackendUrls[0]);
      
      return possibleBackendUrls[0];
    }
    
    // Log the API URL in production mode to help with debugging
    console.info('Using backend API URL:', apiUrl);
    
    return apiUrl;
  }
  
  // For local development, use relative URLs (handled by proxy)
  return '';
};

/**
 * Formats a complete API URL by combining the base URL with an endpoint path
 * 
 * @param endpoint - API endpoint path (e.g., '/api/auth/login')
 * @returns Complete URL to use for fetch/axios requests
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBaseApiUrl();
  
  // Log info about API URLs in non-production environments to help debugging
  if (!import.meta.env.PROD && baseUrl) {
    console.info(`API request to ${baseUrl}${endpoint}`);
  }
  
  // If we're using a full base URL, make sure we don't double up on slashes
  if (baseUrl && endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint}`;
  }
  
  return `${baseUrl}${endpoint}`;
};

/**
 * Default fetch options to use for API requests
 * Includes credentials for authentication and standard headers
 */
export const getDefaultFetchOptions = (options: RequestInit = {}): RequestInit => {
  // Add extra debug info in development mode
  if (!import.meta.env.PROD) {
    console.debug('Fetch options:', {
      credentials: 'include',
      ...options
    });
  }
  
  return {
    credentials: 'include', // Always include credentials for cross-origin requests
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
};

/**
 * Helper function to handle fetch errors more gracefully
 * Particularly useful for detecting CORS and authentication issues
 */
export async function handleFetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options || getDefaultFetchOptions());
    
    // If we get a proper response, even if it's an HTTP error, return it
    return response;
  } catch (error) {
    // Special handling for network errors which are often CORS related
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error (possibly CORS related):', error);
      console.error('This is likely a cross-origin issue. Check your CORS settings and ensure:');
      console.error('1. The backend CORS configuration allows this origin');
      console.error('2. Credentials are properly handled on both ends');
      console.error('3. The backend URL is correct in your environment (VITE_API_URL)');
      
      // Re-throw with more information
      const enhancedError = new Error(
        `Network error when accessing ${url} - This may be a CORS issue. ` +
        `Make sure the backend allows requests from ${window.location.origin}`
      );
      throw enhancedError;
    }
    
    // Otherwise just rethrow the original error
    throw error;
  }
}