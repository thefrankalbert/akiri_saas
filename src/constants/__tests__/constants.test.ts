import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_URL,
  PLATFORM_FEE_PERCENT,
  MAX_WEIGHT_KG,
  MIN_PRICE_PER_KG,
  MAX_PHOTOS_PER_REQUEST,
  MAX_FILE_SIZE_MB,
  DEFAULT_PAGE_SIZE,
  SUPPORTED_COUNTRIES,
  ITEM_CATEGORIES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
} from '@/constants';

describe('Scalar constants', () => {
  it('APP_NAME is "Akiri"', () => {
    expect(APP_NAME).toBe('Akiri');
  });

  it('APP_DESCRIPTION is a non-empty string', () => {
    expect(APP_DESCRIPTION).toBeTruthy();
    expect(typeof APP_DESCRIPTION).toBe('string');
  });

  it('APP_URL defaults to http://localhost:3000 when env var is not set', () => {
    expect(APP_URL).toBe('http://localhost:3000');
  });

  it('PLATFORM_FEE_PERCENT is 10', () => {
    expect(PLATFORM_FEE_PERCENT).toBe(10);
  });

  it('MAX_WEIGHT_KG is 30', () => {
    expect(MAX_WEIGHT_KG).toBe(30);
  });

  it('MIN_PRICE_PER_KG is 1', () => {
    expect(MIN_PRICE_PER_KG).toBe(1);
  });

  it('MAX_PHOTOS_PER_REQUEST is 5', () => {
    expect(MAX_PHOTOS_PER_REQUEST).toBe(5);
  });

  it('MAX_FILE_SIZE_MB is 5', () => {
    expect(MAX_FILE_SIZE_MB).toBe(5);
  });

  it('DEFAULT_PAGE_SIZE is 20', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });
});

describe('SUPPORTED_COUNTRIES', () => {
  it('contains exactly 15 entries', () => {
    expect(SUPPORTED_COUNTRIES).toHaveLength(15);
  });

  it('each entry has code, name, and flag properties', () => {
    for (const country of SUPPORTED_COUNTRIES) {
      expect(country).toHaveProperty('code');
      expect(country).toHaveProperty('name');
      expect(country).toHaveProperty('flag');
    }
  });

  it('all country codes are 2-letter uppercase strings', () => {
    for (const country of SUPPORTED_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('contains France (FR) and Cameroun (CM)', () => {
    const codes = SUPPORTED_COUNTRIES.map((c) => c.code);
    expect(codes).toContain('FR');
    expect(codes).toContain('CM');
  });
});

describe('ITEM_CATEGORIES', () => {
  it('contains exactly 10 entries', () => {
    expect(ITEM_CATEGORIES).toHaveLength(10);
  });

  it('all entries are non-empty strings', () => {
    for (const category of ITEM_CATEGORIES) {
      expect(typeof category).toBe('string');
      expect(category.length).toBeGreaterThan(0);
    }
  });
});

describe('REQUEST_STATUS_LABELS', () => {
  const expectedKeys = [
    'pending',
    'accepted',
    'paid',
    'collected',
    'in_transit',
    'delivered',
    'confirmed',
    'disputed',
    'cancelled',
  ];

  it('has exactly 9 keys', () => {
    expect(Object.keys(REQUEST_STATUS_LABELS)).toHaveLength(9);
  });

  it('contains all expected status keys', () => {
    for (const key of expectedKeys) {
      expect(REQUEST_STATUS_LABELS).toHaveProperty(key);
    }
  });

  it('all values are non-empty strings', () => {
    for (const value of Object.values(REQUEST_STATUS_LABELS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe('REQUEST_STATUS_COLORS', () => {
  const expectedKeys = [
    'pending',
    'accepted',
    'paid',
    'collected',
    'in_transit',
    'delivered',
    'confirmed',
    'disputed',
    'cancelled',
  ];

  it('has the same 9 keys as REQUEST_STATUS_LABELS', () => {
    expect(Object.keys(REQUEST_STATUS_COLORS).sort()).toEqual(
      Object.keys(REQUEST_STATUS_LABELS).sort()
    );
  });

  it('all values contain both bg- and text- Tailwind classes', () => {
    for (const key of expectedKeys) {
      const value = REQUEST_STATUS_COLORS[key];
      expect(value).toMatch(/bg-/);
      expect(value).toMatch(/text-/);
    }
  });
});
