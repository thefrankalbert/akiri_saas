import * as Sentry from '@sentry/nextjs';

type LogContext = Record<string, unknown>;

export const logger = {
  error(message: string, error?: unknown, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, error, context);
      return;
    }

    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { error, ...context },
      });
    }
  },

  warn(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, context);
      return;
    }

    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  },

  info(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO] ${message}`, context);
      return;
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  },
};
