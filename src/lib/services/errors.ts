export type ServiceErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'INTERNAL' | 'AUTH';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function serviceErrorToStatus(code: ServiceErrorCode): number {
  const map: Record<ServiceErrorCode, number> = {
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION: 400,
    AUTH: 403,
    INTERNAL: 500,
  };
  return map[code];
}
