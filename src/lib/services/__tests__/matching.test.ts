import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMatchingService } from '../matching';
import { createMockSupabase, asSupabase } from './helpers';
import { ServiceError } from '../errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('createMatchingService', () => {
  let mock: ReturnType<typeof createMockSupabase>;
  let service: ReturnType<typeof createMatchingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    service = createMatchingService(asSupabase(mock));
  });

  describe('findMatchingListings', () => {
    const parcel = {
      departure_country: 'FR',
      arrival_country: 'SN',
      departure_city: 'Paris',
      arrival_city: 'Dakar',
      weight_kg: 5,
      desired_date: '2026-05-01',
      budget_per_kg: 10,
    };

    it('returns scored listings sorted by score descending', async () => {
      const listings = [
        {
          id: 'l-1',
          departure_city: 'Paris',
          arrival_city: 'Dakar',
          available_kg: 10,
          departure_date: '2026-04-15',
          price_per_kg: 8,
        },
        {
          id: 'l-2',
          departure_city: 'Lyon',
          arrival_city: 'Dakar',
          available_kg: 3,
          departure_date: '2026-06-01',
          price_per_kg: 15,
        },
      ];

      mock._getChain('listings').gte.mockResolvedValue({
        data: listings,
        error: null,
      });

      const result = await service.findMatchingListings(parcel as any);

      expect(result.length).toBe(2);
      // l-1 should score higher: same cities (+6), capacity (+2), date (+2), budget (+1) = 12
      // l-2: arrival match (+3), no capacity, no date, no budget = 4
      expect(result[0].listing.id).toBe('l-1');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('returns empty array when no listings found', async () => {
      mock._getChain('listings').gte.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.findMatchingListings(parcel as any);
      expect(result).toEqual([]);
    });

    it('returns max 5 results', async () => {
      const listings = Array.from({ length: 10 }, (_, i) => ({
        id: `l-${i}`,
        departure_city: 'Paris',
        arrival_city: 'Dakar',
        available_kg: 10,
        departure_date: '2026-04-15',
        price_per_kg: 8,
      }));

      mock._getChain('listings').gte.mockResolvedValue({
        data: listings,
        error: null,
      });

      const result = await service.findMatchingListings(parcel as any);
      expect(result.length).toBe(5);
    });

    it('throws ServiceError on database error', async () => {
      mock._getChain('listings').gte.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.findMatchingListings(parcel as any)).rejects.toThrow(ServiceError);
    });
  });

  describe('findMatchingParcels', () => {
    const listing = {
      departure_country: 'FR',
      arrival_country: 'SN',
      departure_city: 'Paris',
      arrival_city: 'Dakar',
      available_kg: 10,
      departure_date: '2026-04-15',
      price_per_kg: 8,
    };

    it('returns scored parcels sorted by score descending', async () => {
      const parcels = [
        {
          id: 'p-1',
          departure_city: 'Paris',
          arrival_city: 'Dakar',
          weight_kg: 5,
          desired_date: '2026-05-01',
          budget_per_kg: 10,
        },
        {
          id: 'p-2',
          departure_city: 'Marseille',
          arrival_city: 'Saint-Louis',
          weight_kg: 15,
          desired_date: '2026-03-01',
          budget_per_kg: 5,
        },
      ];

      const chain = mock._getChain('parcel_postings');
      // .eq('status').eq('departure_country').eq('arrival_country') — 3 calls
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ data: parcels, error: null });

      const result = await service.findMatchingParcels(listing as any);

      expect(result.length).toBe(2);
      expect(result[0].parcel.id).toBe('p-1');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('returns empty array when no parcels found', async () => {
      const chain = mock._getChain('parcel_postings');
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ data: null, error: null });

      const result = await service.findMatchingParcels(listing as any);
      expect(result).toEqual([]);
    });

    it('returns max 5 results', async () => {
      const parcels = Array.from({ length: 10 }, (_, i) => ({
        id: `p-${i}`,
        departure_city: 'Paris',
        arrival_city: 'Dakar',
        weight_kg: 5,
        desired_date: '2026-05-01',
        budget_per_kg: 10,
      }));

      const chain = mock._getChain('parcel_postings');
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ data: parcels, error: null });

      const result = await service.findMatchingParcels(listing as any);
      expect(result.length).toBe(5);
    });

    it('throws ServiceError on database error', async () => {
      const chain = mock._getChain('parcel_postings');
      chain.eq
        .mockReturnValueOnce(chain)
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

      await expect(service.findMatchingParcels(listing as any)).rejects.toThrow(ServiceError);
    });
  });
});
