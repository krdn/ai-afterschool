import * as Sentry from "@sentry/nextjs";
import { BrowserTracing } from "@sentry/nextjs";

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
    new BrowserTracing({
      shouldCreateSpanForRequest: (url) => {
        // Don't trace Sentry's own requests
        return !url.includes('/sentry/') && !url.includes('sentry.io');
      },
    }),
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      sentry: true,
      xhr: true,
    }),
    Sentry.replayIntegration({
      sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],

  // Set release from environment or package.json version
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',

  // Enable performance monitoring in development
  debug: process.env.NODE_ENV === 'development',

  // Capture user feedback for errors
  beforeSend(event, hint) {
    // Check if the event is an error
    if (event.exception) {
      event.feedback = {
        message: event.message || 'An error occurred',
        name: 'User Feedback',
      };
    }
    return event;
  },
});
