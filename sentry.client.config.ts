import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // Don't send in dev unless DSN is set
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    return event;
  },
});
