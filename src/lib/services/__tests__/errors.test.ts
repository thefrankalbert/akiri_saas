import { describe, it, expect } from 'vitest';
import { ServiceError, serviceErrorToStatus } from '../errors';
import type { ServiceErrorCode } from '../errors';

describe('ServiceError', () => {
  it('extends Error with correct name', () => {
    const err = new ServiceError('Not found', 'NOT_FOUND');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ServiceError');
    expect(err.message).toBe('Not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('stores optional details', () => {
    const details = { field: 'email', reason: 'duplicate' };
    const err = new ServiceError('Conflict', 'CONFLICT', details);
    expect(err.details).toEqual(details);
  });

  it('defaults details to undefined', () => {
    const err = new ServiceError('Bad input', 'VALIDATION');
    expect(err.details).toBeUndefined();
  });
});

describe('serviceErrorToStatus', () => {
  const cases: [ServiceErrorCode, number][] = [
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['VALIDATION', 400],
    ['AUTH', 401],
    ['UNAUTHORIZED', 403],
    ['INTERNAL', 500],
  ];

  it.each(cases)('maps %s to %d', (code, status) => {
    expect(serviceErrorToStatus(code)).toBe(status);
  });
});
