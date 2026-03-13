import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createListingsService } from '../listings';
import { createMockSupabase, asSupabase } from './helpers';
import { ServiceError } from '../errors';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('createListingsService', () => {
  let mock: ReturnType<typeof createMockSupabase>;
  let service: ReturnType<typeof createListingsService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    service = createListingsService(asSupabase(mock));
  });

  describe('getListings', () => {
    it('returns paginated listings with defaults', async () => {
      const listings = [{ id: '1', status: 'active' }];
      mock._getChain('listings').range.mockResolvedValue({
        data: listings,
        error: null,
        count: 1,
      });

      const result = await service.getListings();

      expect(mock.from).toHaveBeenCalledWith('listings');
      expect(result.data).toEqual(listings);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.total_pages).toBe(1);
    });

    it('applies departure_country filter', async () => {
      mock._getChain('listings').range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.getListings({ departure_country: 'FR' });

      // eq is called for status + departure_country
      expect(mock._getChain('listings').eq).toHaveBeenCalledWith('departure_country', 'FR');
    });

    it('applies arrival_country filter', async () => {
      mock._getChain('listings').range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.getListings({ arrival_country: 'SN' });

      expect(mock._getChain('listings').eq).toHaveBeenCalledWith('arrival_country', 'SN');
    });

    it('applies min_kg filter', async () => {
      mock._getChain('listings').range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.getListings({ min_kg: 5 });

      expect(mock._getChain('listings').gte).toHaveBeenCalledWith('available_kg', 5);
    });

    it('applies max_price filter', async () => {
      mock._getChain('listings').range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.getListings({ max_price: 10 });

      expect(mock._getChain('listings').lte).toHaveBeenCalledWith('price_per_kg', 10);
    });

    it('throws ServiceError on database error', async () => {
      mock._getChain('listings').range.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
        count: null,
      });

      await expect(service.getListings()).rejects.toThrow(ServiceError);
    });

    it('respects page and per_page params', async () => {
      mock._getChain('listings').range.mockResolvedValue({
        data: [],
        error: null,
        count: 50,
      });

      const result = await service.getListings({ page: 3, per_page: 10 });

      expect(mock._getChain('listings').range).toHaveBeenCalledWith(20, 29);
      expect(result.page).toBe(3);
      expect(result.per_page).toBe(10);
      expect(result.total_pages).toBe(5);
    });
  });

  describe('getListingById', () => {
    it('returns listing by id', async () => {
      const listing = { id: 'abc', status: 'active' };
      mock._getChain('listings').single.mockResolvedValue({
        data: listing,
        error: null,
      });

      const result = await service.getListingById('abc');

      expect(result).toEqual(listing);
      expect(mock._getChain('listings').eq).toHaveBeenCalledWith('id', 'abc');
    });

    it('throws NOT_FOUND on missing listing', async () => {
      mock._getChain('listings').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      await expect(service.getListingById('missing')).rejects.toThrow(ServiceError);
      try {
        await service.getListingById('missing');
      } catch (e) {
        expect((e as ServiceError).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('createListing', () => {
    it('creates a listing with traveler_id and active status', async () => {
      const input = {
        departure_country: 'FR',
        departure_city: 'Paris',
        arrival_country: 'SN',
        arrival_city: 'Dakar',
        departure_date: '2026-04-01',
        available_kg: 10,
        price_per_kg: 8,
      };
      const created = { id: 'new-1', ...input, status: 'active', traveler_id: 'user-1' };
      mock._getChain('listings').single.mockResolvedValue({
        data: created,
        error: null,
      });

      const result = await service.createListing('user-1', input as any);

      expect(mock._getChain('listings').insert).toHaveBeenCalledWith({
        traveler_id: 'user-1',
        ...input,
        status: 'active',
      });
      expect(result).toEqual(created);
    });

    it('throws VALIDATION on insert error', async () => {
      mock._getChain('listings').single.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key' },
      });

      await expect(service.createListing('user-1', {} as any)).rejects.toThrow(ServiceError);
    });
  });

  describe('updateListing', () => {
    it('updates a listing with ownership check', async () => {
      const updated = { id: 'l-1', available_kg: 15 };
      mock._getChain('listings').single.mockResolvedValue({
        data: updated,
        error: null,
      });

      const result = await service.updateListing('l-1', 'user-1', { available_kg: 15 } as any);

      expect(mock._getChain('listings').eq).toHaveBeenCalledWith('id', 'l-1');
      expect(mock._getChain('listings').eq).toHaveBeenCalledWith('traveler_id', 'user-1');
      expect(result).toEqual(updated);
    });

    it('throws AUTH when not owner (PGRST116)', async () => {
      mock._getChain('listings').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await service.updateListing('l-1', 'wrong-user', {} as any);
      } catch (e) {
        expect((e as ServiceError).code).toBe('AUTH');
      }
    });
  });

  describe('cancelListing', () => {
    it('cancels a listing with ownership and status check', async () => {
      const chain = mock._getChain('listings');
      // .eq('id').eq('traveler_id').eq('status') — 3 calls, last resolves
      chain.eq
        .mockReturnValueOnce(chain) // eq('id', ...)
        .mockReturnValueOnce(chain) // eq('traveler_id', ...)
        .mockResolvedValueOnce({ error: null }); // eq('status', 'active')

      await service.cancelListing('l-1', 'user-1');

      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'l-1');
      expect(chain.eq).toHaveBeenCalledWith('traveler_id', 'user-1');
    });
  });

  describe('getListingsByTraveler', () => {
    it('returns listings for a traveler', async () => {
      const listings = [{ id: '1' }, { id: '2' }];
      mock._getChain('listings').order.mockResolvedValue({
        data: listings,
        error: null,
      });

      const result = await service.getListingsByTraveler('user-1');

      expect(mock._getChain('listings').eq).toHaveBeenCalledWith('traveler_id', 'user-1');
      expect(result).toEqual(listings);
    });

    it('throws ServiceError on database error', async () => {
      mock._getChain('listings').order.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.getListingsByTraveler('user-1')).rejects.toThrow(ServiceError);
    });
  });
});
