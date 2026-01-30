/**
 * Next.js Instrumentation Hook for Sentry
 *
 * This file is automatically detected by Next.js and runs during initialization.
 * It loads the appropriate Sentry configuration based on the runtime environment.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Load Sentry configuration based on runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side runtime (App Router, API routes)
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime (Edge functions, middleware)
    await import('./sentry.edge.config');
  }
}

/**
 * Capture request errors automatically
 * This is called when a request fails during the request lifecycle
 */
export const onRequestError = Sentry.captureRequestError;
