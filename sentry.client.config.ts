import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Filter sensitive data from client-side errors
  beforeSend(event, hint) {
    // Remove passwords, tokens from error messages
    if (event.message) {
      event.message = event.message
        .replace(/password=\w+/gi, 'password=***')
        .replace(/token=[\w-]+/gi, 'token=***')
        .replace(/apiKey=[\w-]+/gi, 'apiKey=***')
        .replace(/secret=[\w-]+/gi, 'secret=***');
    }

    // Redact sensitive data from request data
    if (event.request?.headers) {
      const headers = { ...event.request.headers };
      delete headers.authorization;
      delete headers.cookie;
      delete headers['x-api-key'];
      event.request.headers = headers;
    }

    // Redact URLs that might contain sensitive data
    if (event.request?.url) {
      event.request.url = event.request.url
        .replace(/password=[^&]+/gi, 'password=***')
        .replace(/token=[^&]+/gi, 'token=***')
        .replace(/apiKey=[^&]+/gi, 'apiKey=***');
    }

    return event;
  },

  // Client-side integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn'],
    }),
  ],

  // Session Replay sampling
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Set release from environment or package.json version
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',

  // Enable performance monitoring in development
  debug: process.env.NODE_ENV === 'development',
});
