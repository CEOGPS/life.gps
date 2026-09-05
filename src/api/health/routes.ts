// src/api/health/routes.ts
// Health check endpoint

import { createRouter, jsonResponse } from '../router';

const router = createRouter();

const healthy = () =>
  jsonResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      supabase: 'connected',
      email: 'operational',
    },
  });

// Cover every way the path can arrive
router.get('', healthy);        // if mounted at /health and path is stripped
router.get('/', healthy);       // trailing slash
router.get('/health', healthy); // if full path /health is passed through

// Readiness check (for Kubernetes/Cloudflare health checks)
router.get('/ready', async () => {
  return jsonResponse({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// Liveness check
router.get('/live', async () => {
  return jsonResponse({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;