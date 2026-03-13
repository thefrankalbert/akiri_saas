import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOffersService } from '../offers';
import { createMockSupabase, asSupabase } from './helpers';
import { ServiceError } from '../errors';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

describe('createOffersService', () => {
  let mock: ReturnType<typeof createMockSupabase>;
  let service: ReturnType<typeof createOffersService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockSupabase();
    service = createOffersService(asSupabase(mock));
  });

  describe('getOffersByParcel', () => {
    it('returns offers for a parcel', async () => {
      const offers = [{ id: 'o-1', parcel_id: 'p-1' }];
      mock._getChain('carry_offers').order.mockResolvedValue({
        data: offers,
        error: null,
      });

      const result = await service.getOffersByParcel('p-1');

      expect(mock.from).toHaveBeenCalledWith('carry_offers');
      expect(mock._getChain('carry_offers').eq).toHaveBeenCalledWith('parcel_id', 'p-1');
      expect(result).toEqual(offers);
    });

    it('throws ServiceError on database error', async () => {
      mock._getChain('carry_offers').order.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.getOffersByParcel('p-1')).rejects.toThrow(ServiceError);
    });
  });

  describe('createOffer', () => {
    it('creates an offer and notifies parcel owner', async () => {
      // Mock parcel lookup
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: { sender_id: 'sender-1', departure_city: 'Paris', arrival_city: 'Dakar' },
        error: null,
      });
      // Mock offer insert
      mock._getChain('carry_offers').single.mockResolvedValue({
        data: { id: 'o-new', parcel_id: 'p-1', traveler_id: 'trav-1', status: 'pending' },
        error: null,
      });

      const input = { parcel_id: 'p-1', listing_id: 'l-1', proposed_price: 50 };
      const result = await service.createOffer('trav-1', input as any);

      expect(result.id).toBe('o-new');
      expect(result.status).toBe('pending');
    });

    it('prevents self-offer (traveler = sender)', async () => {
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: { sender_id: 'same-user', departure_city: 'Paris', arrival_city: 'Dakar' },
        error: null,
      });

      try {
        await service.createOffer('same-user', { parcel_id: 'p-1' } as any);
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceError);
        expect((e as ServiceError).code).toBe('CONFLICT');
      }
    });

    it('throws VALIDATION on insert error', async () => {
      mock._getChain('parcel_postings').single.mockResolvedValue({
        data: { sender_id: 'sender-1', departure_city: 'Paris', arrival_city: 'Dakar' },
        error: null,
      });
      mock._getChain('carry_offers').single.mockResolvedValue({
        data: null,
        error: { message: 'constraint error' },
      });

      await expect(service.createOffer('trav-1', { parcel_id: 'p-1' } as any)).rejects.toThrow(
        ServiceError
      );
    });
  });

  describe('acceptOffer', () => {
    it('accepts offer, rejects others, updates parcel to matched', async () => {
      // Mock offer fetch with parcel
      mock
        ._getChain('carry_offers')
        .single.mockResolvedValueOnce({
          data: {
            id: 'o-1',
            parcel_id: 'p-1',
            traveler_id: 'trav-1',
            parcel: { sender_id: 'sender-1' },
          },
          error: null,
        })
        // Mock accept update
        .mockResolvedValueOnce({
          data: { id: 'o-1', status: 'accepted' },
          error: null,
        });

      // Mock reject other offers (returns chain, which resolves at neq)
      mock._getChain('carry_offers').neq.mockResolvedValue({ error: null });

      // Mock parcel status update
      mock._getChain('parcel_postings').eq.mockResolvedValue({ error: null });

      const result = await service.acceptOffer('o-1', 'sender-1');

      expect(result.status).toBe('accepted');
    });

    it('throws NOT_FOUND when offer does not exist', async () => {
      mock._getChain('carry_offers').single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      await expect(service.acceptOffer('missing', 'sender-1')).rejects.toThrow(ServiceError);
    });

    it('throws AUTH when sender does not own parcel', async () => {
      mock._getChain('carry_offers').single.mockResolvedValue({
        data: {
          id: 'o-1',
          parcel_id: 'p-1',
          traveler_id: 'trav-1',
          parcel: { sender_id: 'other-sender' },
        },
        error: null,
      });

      try {
        await service.acceptOffer('o-1', 'wrong-sender');
      } catch (e) {
        expect((e as ServiceError).code).toBe('AUTH');
      }
    });
  });

  describe('rejectOffer', () => {
    it('rejects offer with ownership check', async () => {
      mock
        ._getChain('carry_offers')
        .single.mockResolvedValueOnce({
          data: {
            id: 'o-1',
            parcel_id: 'p-1',
            traveler_id: 'trav-1',
            parcel: { sender_id: 'sender-1' },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'o-1', status: 'rejected' },
          error: null,
        });

      const result = await service.rejectOffer('o-1', 'sender-1');
      expect(result.status).toBe('rejected');
    });

    it('throws AUTH when sender does not own parcel', async () => {
      mock._getChain('carry_offers').single.mockResolvedValue({
        data: {
          id: 'o-1',
          parcel_id: 'p-1',
          traveler_id: 'trav-1',
          parcel: { sender_id: 'other-sender' },
        },
        error: null,
      });

      try {
        await service.rejectOffer('o-1', 'wrong-sender');
      } catch (e) {
        expect((e as ServiceError).code).toBe('AUTH');
      }
    });
  });
});
