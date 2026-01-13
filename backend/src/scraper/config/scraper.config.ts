export const SCRAPER_CONFIG = {
  rateLimit: {
    requestsPerMinute: 20,
    minDelayMs: 2000,
    maxDelayMs: 5000,
    concurrency: 1,
  },

  retry: {
    maxAttempts: 3,
    baseDelayMs: 5000,
    maxDelayMs: 60000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },

  userAgent:
    "WorldOfBooksExplorer/1.0 (+https://yoursite.com/bot; contact@yoursite.com)",

  discovery: {
    sitemapUrl:
      "https://www.worldofbooks.com/tools/sitemap-builder/sitemap.xml",
    refreshIntervalHours: 24,
  },

  allowedPatterns: [
    /^\/collections\/[\w-]+$/,
    /^\/products\/[\w-]+$/,
    /^\/(en-gb|en-ie|de-de|fr-fr)\/collections\//,
  ],

  blockedPatterns: [
    /sort_by/i,
    /[+%2B]/i,
    /filter.*&.*filter/i,
    /^\/search/,
    /^\/cart/,
    /^\/account/,
  ],

  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeMs: 300000,
  },
} as const;
