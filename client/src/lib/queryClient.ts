import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl, getDefaultFetchOptions } from "./api-config";

/**
 * Enhanced error handling for API responses
 * Extracts and formats error messages from responses
 */
async function handleApiResponse(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    
    try {
      // Try to parse JSON error response
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || res.statusText || `Error ${res.status}`;
    } catch (e) {
      // If not JSON, use text or status
      try {
        errorMessage = await res.text() || res.statusText || `Error ${res.status}`;
      } catch (e2) {
        errorMessage = `Error ${res.status}`;
      }
    }
    
    const error = new Error(errorMessage);
    (error as any).status = res.status;
    throw error;
  }
}

/**
 * Centralized API request function
 * Handles authentication, error formatting, and environment-specific URLs
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use the API configuration to get the full URL
  const fullUrl = getApiUrl(url);
  
  // Prepare fetch options with authentication credentials and proper headers
  const options = getDefaultFetchOptions({
    method,
    headers: {
      "Content-Type": data ? "application/json" : "text/plain",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  // Enhanced logging for authentication-related requests
  if (url.includes('/auth/')) {
    console.log(`Auth request to ${url}`, { 
      credentials: options.credentials,
      method,
      hasData: !!data,
    });
  }

  try {
    const res = await fetch(fullUrl, options);
    
    // Special debug logging for authentication requests
    if (url.includes('/auth/')) {
      console.log(`Auth response from ${url}:`, { 
        status: res.status, 
        statusText: res.statusText,
        headers: {
          'content-type': res.headers.get('content-type'),
          'set-cookie': res.headers.get('set-cookie') ? '(cookie present)' : '(no cookie)',
        }
      });
    }
    
    await handleApiResponse(res);
    return res;
  } catch (error) {
    // Add request details to error for better debugging
    (error as any).url = url;
    (error as any).method = method;
    console.error(`API request failed: ${method} ${url}`, error);
    
    // Enhanced error logging for authentication requests
    if (url.includes('/auth/')) {
      console.error('Authentication request failed. Check that:');
      console.error('1. Backend URL is correct in your environment');
      console.error('2. Cookies are being properly set (SameSite, Secure settings)');
      console.error('3. CORS configuration allows credentials from this origin');
    }
    
    throw error;
  }
}

/**
 * Query function factory for React Query
 * Configurable behavior for authentication failures
 */
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use the API configuration to get the full URL
    const fullUrl = getApiUrl(queryKey[0] as string);
    
    try {
      // Use enhanced fetch options from our central config
      const options = getDefaultFetchOptions({
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        }
      });
      
      // Enhanced debug logging for authentication endpoints
      const endpoint = queryKey[0] as string;
      if (endpoint.includes('/auth/')) {
        console.log(`Auth query to ${endpoint}`, { credentials: options.credentials });
      }
      
      const res = await fetch(fullUrl, options);
      
      // Handle 401 according to specified behavior
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Log this for debugging
        if (endpoint.includes('/auth/')) {
          console.warn(`Auth endpoint ${endpoint} returned 401 Unauthorized`);
        }
        return null;
      }
      
      await handleApiResponse(res);
      return await res.json();
    } catch (error) {
      // Special case for auth errors with returnNull behavior
      if (unauthorizedBehavior === "returnNull" && (error as any).status === 401) {
        return null;
      }
      
      // Add query key to error for better debugging
      (error as any).queryKey = queryKey;
      throw error;
    }
  };

/**
 * Configured Query Client for the application
 * Uses consistent settings for all queries and mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Return null instead of throwing on auth failures
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute - shorter to ensure we get fresher data
      retry: 1, // Allow one retry
      refetchOnMount: true, // Always fetch new data on mount
    },
    mutations: {
      retry: 1, // Allow one retry for mutations
    },
  },
});
