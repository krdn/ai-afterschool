import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry wrapper configuration for source maps upload
// @see https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/
export default withSentryConfig(nextConfig, {
  // Sentry organization and project
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  // Create at: https://sentry.io/settings/auth-tokens/
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source maps configuration
  sourcemaps: {
    // Disable source maps upload in development
    disable: process.env.NODE_ENV !== 'production',

    // Upload source maps for JavaScript files
    assets: ['**/*.js', '**/*.js.map'],

    // Ignore node_modules source maps
    ignore: ['**/node_modules/**'],

    // Delete source maps after upload to save disk space
    deleteSourcemapsAfterUpload: true,
  },

  // Optional: Tunnel route to bypass ad-blockers
  // This creates a route at /monitoring that proxies Sentry requests
  tunnelRoute: '/monitoring',

  // Silent mode to reduce noise in CI logs
  silent: !process.env.CI,

  // Keep existing Sentry options for widenClientFileUpload
  widenClientFileUpload: true,
});
