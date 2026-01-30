import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Filter sensitive data from error reports
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

    return event;
  },

  // Minimal integrations for edge runtime performance
  integrations: [
    Sentry.breadcrumbsIntegration({
      console: false,
      dom: false,
      fetch: true,
      history: true,
      sentry: true,
      xhr: false,
    }),
  ],

  // Set release from environment or package.json version
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',
});
