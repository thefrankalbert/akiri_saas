import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing logger
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('in non-production (default test env)', () => {
    // Vitest runs with NODE_ENV=test by default, which is non-production

    it('error logs to console.error with prefix', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const err = new Error('test');
      logger.error('Something failed', err, { userId: '123' });
      expect(spy).toHaveBeenCalledWith('[ERROR] Something failed', err, { userId: '123' });
      spy.mockRestore();
    });

    it('warn logs to console.warn with prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('Slow query', { duration: 5000 });
      expect(spy).toHaveBeenCalledWith('[WARN] Slow query', { duration: 5000 });
      spy.mockRestore();
    });

    it('info logs to console.info with prefix', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('User signed up', { tenantId: 'abc' });
      expect(spy).toHaveBeenCalledWith('[INFO] User signed up', { tenantId: 'abc' });
      spy.mockRestore();
    });
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('error sends Error instances to Sentry.captureException', () => {
      const err = new Error('payment failed');
      logger.error('Payment failed', err, { orderId: '123' });
      expect(Sentry.captureException).toHaveBeenCalledWith(err, {
        extra: { message: 'Payment failed', orderId: '123' },
      });
    });

    it('error sends non-Error values to Sentry.captureMessage', () => {
      logger.error('Unknown error', 'string-error', { requestId: 'abc' });
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Unknown error', {
        level: 'error',
        extra: { error: 'string-error', requestId: 'abc' },
      });
    });

    it('warn sends to Sentry.captureMessage with warning level', () => {
      logger.warn('Slow query', { duration: 5000 });
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Slow query', {
        level: 'warning',
        extra: { duration: 5000 },
      });
    });

    it('info adds Sentry breadcrumb', () => {
      logger.info('Page viewed', { page: '/dashboard' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Page viewed',
        level: 'info',
        data: { page: '/dashboard' },
      });
    });
  });
});
