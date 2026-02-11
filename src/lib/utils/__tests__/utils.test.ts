import { vi } from 'vitest';
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  truncate,
  getInitials,
  calculatePlatformFee,
} from '@/lib/utils';

// ---------------------------------------------------------------------------
// cn (className merge utility)
// ---------------------------------------------------------------------------
describe('cn', () => {
  it('should merge single class string', () => {
    expect(cn('px-4')).toBe('px-4');
  });

  it('should merge multiple class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('should resolve Tailwind conflicts by keeping the last value', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('should handle conditional classes with objects', () => {
    expect(cn('base', { 'text-red-500': true, 'text-blue-500': false })).toBe('base text-red-500');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
  });

  it('should filter out falsy values', () => {
    expect(cn('px-4', undefined, null, false, 'py-2')).toBe('px-4 py-2');
  });

  it('should return empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('should merge complex Tailwind conflict (bg colors)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('should format a whole number in EUR by default', () => {
    const result = formatCurrency(100);
    // Intl may use non-breaking spaces; use toContain for resilience
    expect(result).toContain('100');
    expect(result).toContain('€');
  });

  it('should format a decimal amount in EUR', () => {
    const result = formatCurrency(49.99);
    expect(result).toContain('49,99');
    expect(result).toContain('€');
  });

  it('should format zero in EUR', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('should format negative amounts', () => {
    const result = formatCurrency(-25.5);
    expect(result).toContain('25,50');
  });

  it('should format in USD when specified', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('100');
    expect(result).toContain('$');
  });

  it('should format in GBP when specified', () => {
    const result = formatCurrency(250, 'GBP');
    expect(result).toContain('250');
    expect(result).toContain('£');
  });

  it('should format large amounts with thousand separators', () => {
    const result = formatCurrency(1234567.89);
    // French locale uses space or narrow no-break space as group separator
    expect(result).toContain('€');
    // Check the digits are present in some form
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('567');
    expect(result).toContain('89');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('should format a Date object', () => {
    const result = formatDate(new Date(2025, 0, 15)); // Jan 15, 2025
    expect(result).toContain('15');
    expect(result).toContain('2025');
    // French month name for January
    expect(result.toLowerCase()).toContain('janvier');
  });

  it('should format an ISO date string', () => {
    const result = formatDate('2024-07-04T00:00:00Z');
    expect(result).toContain('2024');
    expect(result.toLowerCase()).toContain('juillet');
  });

  it('should format a date in December', () => {
    const result = formatDate('2023-12-25');
    expect(result).toContain('2023');
    expect(result.toLowerCase()).toContain('décembre');
  });

  it('should handle a date string without time component', () => {
    const result = formatDate('2024-03-08');
    expect(result).toContain('2024');
    expect(result.toLowerCase()).toContain('mars');
  });

  it('should format the first day of the year', () => {
    const result = formatDate(new Date(2026, 0, 1));
    expect(result).toContain('1');
    expect(result.toLowerCase()).toContain('janvier');
    expect(result).toContain('2026');
  });
});

// ---------------------------------------------------------------------------
// formatRelativeDate
// ---------------------------------------------------------------------------
describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin "now" to a known timestamp: 2025-06-15T12:00:00Z
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "à l\'instant" for less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date('2025-06-15T11:59:35Z');
    expect(formatRelativeDate(thirtySecondsAgo)).toBe("à l'instant");
  });

  it('should return "à l\'instant" for exactly now', () => {
    const now = new Date('2025-06-15T12:00:00Z');
    expect(formatRelativeDate(now)).toBe("à l'instant");
  });

  it('should return minutes for 1 minute ago', () => {
    const oneMinAgo = new Date('2025-06-15T11:59:00Z');
    expect(formatRelativeDate(oneMinAgo)).toBe('il y a 1 min');
  });

  it('should return minutes for 30 minutes ago', () => {
    const thirtyMinsAgo = new Date('2025-06-15T11:30:00Z');
    expect(formatRelativeDate(thirtyMinsAgo)).toBe('il y a 30 min');
  });

  it('should return minutes for 59 minutes ago', () => {
    const fiftyNineMinsAgo = new Date('2025-06-15T11:01:00Z');
    expect(formatRelativeDate(fiftyNineMinsAgo)).toBe('il y a 59 min');
  });

  it('should return hours for exactly 1 hour ago', () => {
    const oneHourAgo = new Date('2025-06-15T11:00:00Z');
    expect(formatRelativeDate(oneHourAgo)).toBe('il y a 1h');
  });

  it('should return hours for 5 hours ago', () => {
    const fiveHoursAgo = new Date('2025-06-15T07:00:00Z');
    expect(formatRelativeDate(fiveHoursAgo)).toBe('il y a 5h');
  });

  it('should return hours for 23 hours ago', () => {
    const twentyThreeHoursAgo = new Date('2025-06-14T13:00:00Z');
    expect(formatRelativeDate(twentyThreeHoursAgo)).toBe('il y a 23h');
  });

  it('should return days for exactly 1 day ago', () => {
    const oneDayAgo = new Date('2025-06-14T12:00:00Z');
    expect(formatRelativeDate(oneDayAgo)).toBe('il y a 1j');
  });

  it('should return days for 3 days ago', () => {
    const threeDaysAgo = new Date('2025-06-12T12:00:00Z');
    expect(formatRelativeDate(threeDaysAgo)).toBe('il y a 3j');
  });

  it('should return days for 6 days ago', () => {
    const sixDaysAgo = new Date('2025-06-09T12:00:00Z');
    expect(formatRelativeDate(sixDaysAgo)).toBe('il y a 6j');
  });

  it('should fall back to formatDate for 7 days ago', () => {
    const sevenDaysAgo = new Date('2025-06-08T12:00:00Z');
    const result = formatRelativeDate(sevenDaysAgo);
    // Should be a full formatted date, not a relative string
    expect(result).toContain('2025');
    expect(result.toLowerCase()).toContain('juin');
  });

  it('should fall back to formatDate for 30 days ago', () => {
    const thirtyDaysAgo = new Date('2025-05-16T12:00:00Z');
    const result = formatRelativeDate(thirtyDaysAgo);
    expect(result).toContain('2025');
    expect(result.toLowerCase()).toContain('mai');
  });

  it('should accept a string date input', () => {
    const result = formatRelativeDate('2025-06-15T11:55:00Z');
    expect(result).toBe('il y a 5 min');
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe('truncate', () => {
  it('should return the original text if shorter than maxLength', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should return the original text if exactly maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('should truncate and add ellipsis when text exceeds maxLength', () => {
    expect(truncate('Hello World', 5)).toBe('Hello…');
  });

  it('should trim trailing whitespace before adding ellipsis', () => {
    expect(truncate('Hello World and more', 6)).toBe('Hello…');
  });

  it('should handle maxLength of 1', () => {
    expect(truncate('Hello', 1)).toBe('H…');
  });

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('should handle maxLength of 0', () => {
    expect(truncate('Hello', 0)).toBe('…');
  });
});

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------
describe('getInitials', () => {
  it('should return uppercase initials from first and last name', () => {
    expect(getInitials('Jean', 'Dupont')).toBe('JD');
  });

  it('should uppercase lowercase input', () => {
    expect(getInitials('alice', 'martin')).toBe('AM');
  });

  it('should handle already uppercase input', () => {
    expect(getInitials('MARIE', 'CURIE')).toBe('MC');
  });

  it('should handle single-character names', () => {
    expect(getInitials('A', 'B')).toBe('AB');
  });

  it('should handle mixed case input', () => {
    expect(getInitials('aBdou', 'kArim')).toBe('AK');
  });

  it('should handle names with accented characters', () => {
    expect(getInitials('Élodie', 'Ève')).toBe('ÉÈ');
  });
});

// ---------------------------------------------------------------------------
// calculatePlatformFee
// ---------------------------------------------------------------------------
describe('calculatePlatformFee', () => {
  it('should calculate 10% fee by default', () => {
    expect(calculatePlatformFee(100)).toBe(10);
  });

  it('should calculate 10% fee on a decimal amount', () => {
    expect(calculatePlatformFee(49.99)).toBe(5);
  });

  it('should return 0 for a zero amount', () => {
    expect(calculatePlatformFee(0)).toBe(0);
  });

  it('should accept a custom fee percentage', () => {
    expect(calculatePlatformFee(100, 15)).toBe(15);
  });

  it('should handle 0% fee', () => {
    expect(calculatePlatformFee(100, 0)).toBe(0);
  });

  it('should handle 100% fee', () => {
    expect(calculatePlatformFee(250, 100)).toBe(250);
  });

  it('should round to 2 decimal places', () => {
    // 33.33 * 10% = 3.333 -> should round to 3.33
    expect(calculatePlatformFee(33.33)).toBe(3.33);
  });

  it('should correctly round half-cent amounts', () => {
    // 10.05 * 10% = 1.005 -> Math.round(100.5) / 100 = 1.01
    expect(calculatePlatformFee(10.05)).toBe(1.01);
  });
});
