// src/api/router.ts
// Router helper using itty-router for Cloudflare Workers

import { Router } from 'itty-router';

/**
 * Creates a new router instance with common middleware
 * Uses itty-router for Cloudflare Workers compatibility
 */
export function createRouter() {
  const router = Router();

  // Add common middleware
  router.all('*', async (request, env, ctx) => {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Add user context from auth header (if using Firebase auth)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      // User context would be extracted here
      // For now, we'll add it to the request object
    }

    return undefined; // Continue to next handler
  });

  return router;
}

/**
 * Helper to create JSON responses with CORS
 */
export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Helper to create error responses
 */
export function errorResponse(message: string, status = 500, details?: any) {
  return jsonResponse(
    {
      error: message,
      ...(details && { details }),
    },
    status
  );
}

/**
 * Helper to parse request body
 */
export async function parseBody(request: Request) {
  const contentType = request.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    return await request.json();
  }
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    const body: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }
    return body;
  }
  return {};
}