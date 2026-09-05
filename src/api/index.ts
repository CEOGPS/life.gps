// src/api/index.ts
// This is the main API router that will be mounted on /api

import { createRouter } from './router';
// import emailTrackingRoutes from './email/tracking/routes';
// import emailSendRoutes from './email/send/routes';
// import emailListRoutes from './email/lists/routes';
import healthRoutes from './health/routes';
import cronRoutes from './cron/routes';
import webhookRoutes from './webhooks/routes';
import zerobounceRoutes from './webhooks/zerobounce/routes';

const router = createRouter();

// router.use('/email/tracking', emailTrackingRoutes);
// router.use('/email/send', emailSendRoutes);
// router.use('/email/lists', emailListRoutes);
router.use('/health', healthRoutes);
router.use('/cron', cronRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/webhooks/zerobounce', zerobounceRoutes);

export default router;