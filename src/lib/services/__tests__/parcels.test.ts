import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createParcelsService } from '../parcels';
import { createMockSupabase, asSupabase } from './helpers';
import { ServiceError } from '../errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('createParcelsService', () => {
  let mock: ReturnType<typeof createMockSupabase>;
  let service: ReturnType<typeof createParcelsService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    service = createParcelsService(asSupabase(mock));
  });

  describe('getParcels', () => {
    it('returns paginated parcels with defaults', async () => {
      const parcels = [{ id: 'p-1', status: 'active' }];
      mock._getChain('parcel_postings').range.mockResolvedValue({
        data: parcels,
        error: null,
        count: 1,
      });

      const result = await service.getParcels();

      expect(mock.from).toHaveBeenCalledWith('parcel_postings');
      expect(result.data).toEqual(parcels);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('applies filters (departure_country, category, urgency)', async () => {
      mock._getChain('parcel_postings').range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await service.getParcels({
        departure_country: 'FR',
        category: 'documents',
        urgency: 'high',
      });

      const eq = mock._getChain('parcel_postings').eq;
      expect(eq).toHaveBeenCalledWith('departure_country', 'FR');
      expect(eq).toHaveBeenCalledWith('category', 'documents');
      expect(eq).toHaveBeenCalledWith('urgency', 'high');
    });

    it('throws ServiceError on database error', async () => {
      mock._getChain('parcel_postings').range.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
        count: null,
      });

      await expect(service.getParcels()).rejects.toThrow(ServiceError);
    });
  });

  describe('getParcelById', () => {
    it('returns parcel by id', async () => {
      const parcel = { id: 'p-1', status: 'active' };
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: parcel,
        error: null,
      });

      const result = await service.getParcelById('p-1');
      expect(result).toEqual(parcel);
    });

    it('throws NOT_FOUND when parcel does not exist', async () => {
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      try {
        await service.getParcelById('missing');
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('createParcel', () => {
    it('creates a parcel with sender_id and active status', async () => {
      const input = {
        departure_country: 'FR',
        departure_city: 'Paris',
        arrival_country: 'SN',
        arrival_city: 'Dakar',
        weight_kg: 5,
        description: 'Test parcel',
      };
      const created = { id: 'p-new', ...input, sender_id: 'user-1', status: 'active' };
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: created,
        error: null,
      });

      const result = await service.createParcel('user-1', input as any);

      expect(mock._getChain('parcel_postings').insert).toHaveBeenCalledWith({
        sender_id: 'user-1',
        ...input,
        status: 'active',
      });
      expect(result).toEqual(created);
    });

    it('throws VALIDATION when weight exceeds 30kg', async () => {
      try {
        await service.createParcel('user-1', { weight_kg: 35 } as any);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('VALIDATION');
      }
    });

    it('throws VALIDATION on insert error', async () => {
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: null,
        error: { message: 'constraint violation' },
      });

      await expect(service.createParcel('user-1', { weight_kg: 5 } as any)).rejects.toThrow(
        ServiceError
      );
    });
  });

  describe('updateParcelStatus', () => {
    it('updates parcel status with ownership check', async () => {
      const updated = { id: 'p-1', status: 'matched' };
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: updated,
        error: null,
      });

      const result = await service.updateParcelStatus('p-1', 'user-1', 'matched' as any);

      expect(mock._getChain('parcel_postings').eq).toHaveBeenCalledWith('id', 'p-1');
      expect(mock._getChain('parcel_postings').eq).toHaveBeenCalledWith('sender_id', 'user-1');
      expect(result).toEqual(updated);
    });

    it('throws AUTH when not owner (PGRST116)', async () => {
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'no rows' },
      });

      try {
        await service.updateParcelStatus('p-1', 'wrong-user', 'matched' as any);
      } catch (e) {
        expect((e as ServiceError).code).toBe('AUTH');
      }
    });
  });

  describe('getParcelsBySender', () => {
    it('returns parcels for a sender', async () => {
      const parcels = [{ id: 'p-1' }, { id: 'p-2' }];
      mock._getChain('parcel_postings').order.mockResolvedValue({
        data: parcels,
        error: null,
      });

      const result = await service.getParcelsBySender('user-1');

      expect(mock._getChain('parcel_postings').eq).toHaveBeenCalledWith('sender_id', 'user-1');
      expect(result).toEqual(parcels);
    });

    it('throws ServiceError on database error', async () => {
      mock._getChain('parcel_postings').order.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.getParcelsBySender('user-1')).rejects.toThrow(ServiceError);
    });
  });
});
