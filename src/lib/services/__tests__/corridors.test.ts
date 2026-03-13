import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, asSupabase } from './helpers';
import { createCorridorsService } from '@/lib/services/corridors';
import { ServiceError } from '@/lib/services/errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ============================================
// Test Data
// ============================================

function setup() {
  const mockSupabase = createMockSupabase();
  const service = createCorridorsService(asSupabase(mockSupabase));
  return { mockSupabase, service };
}

// ============================================
// Tests
// ============================================

describe('Corridors Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------
  // getCorridors
  // -----------------------------------------
  describe('getCorridors', () => {
    it('returns aggregated corridors sorted by count', async () => {
      const { mockSupabase, service } = setup();

      const listings = [
        { departure_country: 'France', arrival_country: 'Cameroun', price_per_kg: 10 },
        { departure_country: 'France', arrival_country: 'Cameroun', price_per_kg: 12 },
        { departure_country: 'France', arrival_country: 'Cameroun', price_per_kg: 14 },
        { departure_country: 'Belgique', arrival_country: 'Sénégal', price_per_kg: 8 },
        { departure_country: 'Belgique', arrival_country: 'Sénégal', price_per_kg: 10 },
      ];

      // Chain: select().eq().gte() -> resolves (gte is last)
      mockSupabase._getChain('listings').gte.mockResolvedValueOnce({
        data: listings,
        error: null,
      });

      const result = await service.getCorridors();

      expect(result).toHaveLength(2);

      // France -> Cameroun has 3 listings, sorted first
      expect(result[0]).toEqual({
        departure_country: 'France',
        arrival_country: 'Cameroun',
        active_listings: 3,
        avg_price_per_kg: 12, // (10+12+14)/3 = 12
      });

      // Belgique -> Sénégal has 2 listings
      expect(result[1]).toEqual({
        departure_country: 'Belgique',
        arrival_country: 'Sénégal',
        active_listings: 2,
        avg_price_per_kg: 9, // (8+10)/2 = 9
      });
    });

    it('returns empty array when no active listings', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('listings').gte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.getCorridors();

      expect(result).toEqual([]);
    });

    it('throws INTERNAL on database error', async () => {
      const { mockSupabase, service } = setup();

      mockSupabase._getChain('listings').gte.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      try {
        await service.getCorridors();
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('INTERNAL');
      }
    });
  });
});
