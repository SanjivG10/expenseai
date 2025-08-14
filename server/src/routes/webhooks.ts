import { Router } from 'express';

const router = Router();

// Removed Stripe webhook - using IAP only
// No webhooks needed for IAP as we verify purchases directly

export default router;
