import { vi } from 'vitest';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  createListingSchema,
  createRequestSchema,
  createReviewSchema,
  sendMessageSchema,
  confirmDeliverySchema,
  searchListingsSchema,
  createCheckoutSchema,
  refundSchema,
} from '@/lib/validations';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ---------------------------------------------------------------------------
// 1. loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Adresse email invalide');
  });

  it('rejects empty email string', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      'Le mot de passe doit contenir au moins 8 caractères'
    );
  });

  it('accepts password exactly 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password string', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  const validRegister = {
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean@example.com',
    password: 'Password1',
    confirm_password: 'Password1',
    accept_terms: true as const,
  };

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  // first_name
  it('rejects first_name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validRegister, first_name: 'J' });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Le prénom doit contenir au moins 2 caractères');
  });

  it('accepts first_name exactly 2 characters', () => {
    const result = registerSchema.safeParse({ ...validRegister, first_name: 'Jo' });
    expect(result.success).toBe(true);
  });

  it('rejects first_name longer than 50 characters', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      first_name: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('accepts first_name exactly 50 characters', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      first_name: 'A'.repeat(50),
    });
    expect(result.success).toBe(true);
  });

  // last_name
  it('rejects last_name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validRegister, last_name: 'D' });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Le nom doit contenir au moins 2 caractères');
  });

  it('accepts last_name exactly 2 characters', () => {
    const result = registerSchema.safeParse({ ...validRegister, last_name: 'Du' });
    expect(result.success).toBe(true);
  });

  it('rejects last_name longer than 50 characters', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      last_name: 'B'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  // email
  it('rejects invalid email in registration', () => {
    const result = registerSchema.safeParse({ ...validRegister, email: 'bad' });
    expect(result.success).toBe(false);
  });

  // password strength
  it('rejects password without uppercase letter', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'password1',
      confirm_password: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without lowercase letter', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'PASSWORD1',
      confirm_password: 'PASSWORD1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without digit', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'Passwords',
      confirm_password: 'Passwords',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters even if has upper, lower, digit', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'Pass1ab',
      confirm_password: 'Pass1ab',
    });
    expect(result.success).toBe(false);
  });

  // confirm_password refinement
  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      confirm_password: 'Different1',
    });
    expect(result.success).toBe(false);
    expect(
      result.error!.issues.some((i) => i.message === 'Les mots de passe ne correspondent pas')
    ).toBe(true);
  });

  // accept_terms
  it('rejects when accept_terms is false', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      accept_terms: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects when accept_terms is missing', () => {
    const { accept_terms: _, ...withoutTerms } = validRegister;
    const result = registerSchema.safeParse(withoutTerms);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. updateProfileSchema
// ---------------------------------------------------------------------------
describe('updateProfileSchema', () => {
  it('accepts valid profile update with all fields', () => {
    const result = updateProfileSchema.safeParse({
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '+33612345678',
      bio: 'Je suis voyageur.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts null phone', () => {
    const result = updateProfileSchema.safeParse({ phone: null });
    expect(result.success).toBe(true);
  });

  it('accepts null bio', () => {
    const result = updateProfileSchema.safeParse({ bio: null });
    expect(result.success).toBe(true);
  });

  it('rejects first_name shorter than 2 characters when provided', () => {
    const result = updateProfileSchema.safeParse({ first_name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects first_name longer than 50 characters when provided', () => {
    const result = updateProfileSchema.safeParse({ first_name: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('rejects last_name shorter than 2 characters when provided', () => {
    const result = updateProfileSchema.safeParse({ last_name: 'B' });
    expect(result.success).toBe(false);
  });

  it('rejects last_name longer than 50 characters when provided', () => {
    const result = updateProfileSchema.safeParse({ last_name: 'B'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone format', () => {
    const result = updateProfileSchema.safeParse({ phone: '123' });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Numéro de téléphone invalide');
  });

  it('accepts valid international phone with + prefix', () => {
    const result = updateProfileSchema.safeParse({ phone: '+2250101020304' });
    expect(result.success).toBe(true);
  });

  it('accepts valid phone without + prefix', () => {
    const result = updateProfileSchema.safeParse({ phone: '33612345678' });
    expect(result.success).toBe(true);
  });

  it('rejects phone starting with 0', () => {
    const result = updateProfileSchema.safeParse({ phone: '0612345678' });
    expect(result.success).toBe(false);
  });

  it('rejects bio longer than 500 characters', () => {
    const result = updateProfileSchema.safeParse({ bio: 'x'.repeat(501) });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('La bio ne peut pas dépasser 500 caractères');
  });

  it('accepts bio exactly 500 characters', () => {
    const result = updateProfileSchema.safeParse({ bio: 'x'.repeat(500) });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. createListingSchema
// ---------------------------------------------------------------------------
describe('createListingSchema', () => {
  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  };

  const futureDatePlus14 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString();
  };

  const validListing = () => ({
    departure_city: 'Paris',
    departure_country: 'France',
    arrival_city: 'Abidjan',
    arrival_country: "Côte d'Ivoire",
    departure_date: futureDate(),
    available_kg: 10,
    price_per_kg: 5,
    currency: 'EUR',
    accepted_items: ['Vêtements'],
    collection_points: ['Gare du Nord'],
  });

  it('accepts valid listing data', () => {
    const result = createListingSchema.safeParse(validListing());
    expect(result.success).toBe(true);
  });

  it('accepts listing with all optional fields provided', () => {
    const result = createListingSchema.safeParse({
      ...validListing(),
      arrival_date: futureDatePlus14(),
      description: 'Transport sûr',
      refused_items: ['Liquides'],
    });
    expect(result.success).toBe(true);
  });

  // departure_city
  it('rejects departure_city shorter than 2 characters', () => {
    const result = createListingSchema.safeParse({ ...validListing(), departure_city: 'P' });
    expect(result.success).toBe(false);
  });

  // departure_country
  it('rejects departure_country shorter than 2 characters', () => {
    const result = createListingSchema.safeParse({ ...validListing(), departure_country: 'F' });
    expect(result.success).toBe(false);
  });

  // arrival_city
  it('rejects arrival_city shorter than 2 characters', () => {
    const result = createListingSchema.safeParse({ ...validListing(), arrival_city: 'A' });
    expect(result.success).toBe(false);
  });

  // arrival_country
  it('rejects arrival_country shorter than 2 characters', () => {
    const result = createListingSchema.safeParse({ ...validListing(), arrival_country: 'C' });
    expect(result.success).toBe(false);
  });

  // departure_date – past date
  describe('departure_date validation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects a departure_date in the past', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-06-14T00:00:00Z',
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(false);
      expect(
        result.error!.issues.some((i) =>
          i.message.includes('La date de départ doit être dans le futur')
        )
      ).toBe(true);
    });

    it('accepts a departure_date that is today', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-06-15T23:59:59Z',
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(true);
    });

    it('accepts a departure_date in the future', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-07-01T00:00:00Z',
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(true);
    });
  });

  // available_kg boundaries
  it('rejects available_kg less than 1', () => {
    const result = createListingSchema.safeParse({ ...validListing(), available_kg: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts available_kg exactly 1', () => {
    const result = createListingSchema.safeParse({ ...validListing(), available_kg: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts available_kg exactly 30 (MAX_WEIGHT_KG)', () => {
    const result = createListingSchema.safeParse({ ...validListing(), available_kg: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects available_kg greater than 30', () => {
    const result = createListingSchema.safeParse({ ...validListing(), available_kg: 31 });
    expect(result.success).toBe(false);
  });

  // price_per_kg boundaries
  it('rejects price_per_kg less than 1 (MIN_PRICE_PER_KG)', () => {
    const result = createListingSchema.safeParse({ ...validListing(), price_per_kg: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts price_per_kg exactly 1', () => {
    const result = createListingSchema.safeParse({ ...validListing(), price_per_kg: 1 });
    expect(result.success).toBe(true);
  });

  // description
  it('rejects description longer than 1000 characters', () => {
    const result = createListingSchema.safeParse({
      ...validListing(),
      description: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts null description', () => {
    const result = createListingSchema.safeParse({ ...validListing(), description: null });
    expect(result.success).toBe(true);
  });

  // accepted_items
  it('rejects empty accepted_items array', () => {
    const result = createListingSchema.safeParse({ ...validListing(), accepted_items: [] });
    expect(result.success).toBe(false);
  });

  // collection_points
  it('rejects empty collection_points array', () => {
    const result = createListingSchema.safeParse({ ...validListing(), collection_points: [] });
    expect(result.success).toBe(false);
  });

  it('rejects collection point shorter than 3 characters', () => {
    const result = createListingSchema.safeParse({
      ...validListing(),
      collection_points: ['AB'],
    });
    expect(result.success).toBe(false);
  });

  // arrival_date refinement
  describe('arrival_date refinement', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects arrival_date before departure_date', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-07-10T00:00:00Z',
        arrival_date: '2025-07-09T00:00:00Z',
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(false);
      expect(
        result.error!.issues.some((i) =>
          i.message.includes("La date d'arrivée doit être après la date de départ")
        )
      ).toBe(true);
    });

    it('rejects arrival_date equal to departure_date', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-07-10T00:00:00Z',
        arrival_date: '2025-07-10T00:00:00Z',
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(false);
    });

    it('accepts arrival_date after departure_date', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-07-10T00:00:00Z',
        arrival_date: '2025-07-11T00:00:00Z',
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(true);
    });

    it('passes when arrival_date is null', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-07-10T00:00:00Z',
        arrival_date: null,
      };
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(true);
    });

    it('passes when arrival_date is omitted', () => {
      const listing = {
        ...validListing(),
        departure_date: '2025-07-10T00:00:00Z',
      };
      delete (listing as Record<string, unknown>).arrival_date;
      const result = createListingSchema.safeParse(listing);
      expect(result.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. createRequestSchema
// ---------------------------------------------------------------------------
describe('createRequestSchema', () => {
  const validRequest = {
    listing_id: VALID_UUID,
    weight_kg: 5,
    item_description: 'Vêtements pour la famille',
    special_instructions: null,
  };

  it('accepts valid request data', () => {
    const result = createRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('accepts request with special_instructions provided', () => {
    const result = createRequestSchema.safeParse({
      ...validRequest,
      special_instructions: 'Fragile',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid listing_id (not a UUID)', () => {
    const result = createRequestSchema.safeParse({
      ...validRequest,
      listing_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight_kg less than 0.5', () => {
    const result = createRequestSchema.safeParse({ ...validRequest, weight_kg: 0.4 });
    expect(result.success).toBe(false);
  });

  it('accepts weight_kg exactly 0.5', () => {
    const result = createRequestSchema.safeParse({ ...validRequest, weight_kg: 0.5 });
    expect(result.success).toBe(true);
  });

  it('accepts weight_kg exactly 30 (MAX_WEIGHT_KG)', () => {
    const result = createRequestSchema.safeParse({ ...validRequest, weight_kg: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects weight_kg greater than 30', () => {
    const result = createRequestSchema.safeParse({ ...validRequest, weight_kg: 31 });
    expect(result.success).toBe(false);
  });

  it('rejects item_description shorter than 10 characters', () => {
    const result = createRequestSchema.safeParse({
      ...validRequest,
      item_description: 'Short',
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Décrivez votre colis en au moins 10 caractères');
  });

  it('accepts item_description exactly 10 characters', () => {
    const result = createRequestSchema.safeParse({
      ...validRequest,
      item_description: '1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('rejects item_description longer than 500 characters', () => {
    const result = createRequestSchema.safeParse({
      ...validRequest,
      item_description: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects special_instructions longer than 500 characters', () => {
    const result = createRequestSchema.safeParse({
      ...validRequest,
      special_instructions: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. createReviewSchema
// ---------------------------------------------------------------------------
describe('createReviewSchema', () => {
  const validReview = {
    request_id: VALID_UUID,
    reviewed_id: VALID_UUID,
    rating: 4,
    comment: 'Très bon service',
  };

  it('accepts valid review data', () => {
    const result = createReviewSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it('accepts review with null comment', () => {
    const result = createReviewSchema.safeParse({ ...validReview, comment: null });
    expect(result.success).toBe(true);
  });

  it('accepts review without comment (optional)', () => {
    const { comment: _, ...withoutComment } = validReview;
    const result = createReviewSchema.safeParse(withoutComment);
    expect(result.success).toBe(true);
  });

  it('rejects invalid request_id', () => {
    const result = createReviewSchema.safeParse({ ...validReview, request_id: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid reviewed_id', () => {
    const result = createReviewSchema.safeParse({ ...validReview, reviewed_id: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects rating less than 1', () => {
    const result = createReviewSchema.safeParse({ ...validReview, rating: 0 });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Note minimale : 1');
  });

  it('accepts rating exactly 1', () => {
    const result = createReviewSchema.safeParse({ ...validReview, rating: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts rating exactly 5', () => {
    const result = createReviewSchema.safeParse({ ...validReview, rating: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects rating greater than 5', () => {
    const result = createReviewSchema.safeParse({ ...validReview, rating: 6 });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Note maximale : 5');
  });

  it('rejects non-integer rating', () => {
    const result = createReviewSchema.safeParse({ ...validReview, rating: 3.5 });
    expect(result.success).toBe(false);
  });

  it('rejects comment longer than 1000 characters', () => {
    const result = createReviewSchema.safeParse({
      ...validReview,
      comment: 'c'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. sendMessageSchema
// ---------------------------------------------------------------------------
describe('sendMessageSchema', () => {
  const validMessage = {
    conversation_id: VALID_UUID,
    content: 'Bonjour !',
  };

  it('accepts valid message with defaults', () => {
    const result = sendMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
    expect(result.data!.content_type).toBe('text');
  });

  it('accepts message with explicit content_type', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      content_type: 'image',
    });
    expect(result.success).toBe(true);
  });

  it('accepts message with media_url', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      media_url: 'https://example.com/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts message with null media_url', () => {
    const result = sendMessageSchema.safeParse({ ...validMessage, media_url: null });
    expect(result.success).toBe(true);
  });

  it('rejects invalid conversation_id', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      conversation_id: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = sendMessageSchema.safeParse({ ...validMessage, content: '' });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Le message ne peut pas être vide');
  });

  it('rejects content longer than 2000 characters', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      content: 'm'.repeat(2001),
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe('Message trop long');
  });

  it('accepts content exactly 2000 characters', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      content: 'm'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid content_type enum value', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      content_type: 'video',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid content_type enum values', () => {
    for (const type of ['text', 'image', 'voice', 'system'] as const) {
      const result = sendMessageSchema.safeParse({
        ...validMessage,
        content_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid media_url format', () => {
    const result = sendMessageSchema.safeParse({
      ...validMessage,
      media_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. confirmDeliverySchema
// ---------------------------------------------------------------------------
describe('confirmDeliverySchema', () => {
  const validDelivery = {
    request_id: VALID_UUID,
    confirmation_code: '123456',
  };

  it('accepts valid delivery confirmation', () => {
    const result = confirmDeliverySchema.safeParse(validDelivery);
    expect(result.success).toBe(true);
  });

  it('rejects invalid request_id', () => {
    const result = confirmDeliverySchema.safeParse({
      ...validDelivery,
      request_id: 'not-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects confirmation_code shorter than 6 digits', () => {
    const result = confirmDeliverySchema.safeParse({
      ...validDelivery,
      confirmation_code: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects confirmation_code longer than 6 digits', () => {
    const result = confirmDeliverySchema.safeParse({
      ...validDelivery,
      confirmation_code: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('rejects confirmation_code with non-digit characters', () => {
    const result = confirmDeliverySchema.safeParse({
      ...validDelivery,
      confirmation_code: '12345a',
    });
    expect(result.success).toBe(false);
    expect(
      result.error!.issues.some((i) =>
        i.message.includes('Le code doit contenir uniquement des chiffres')
      )
    ).toBe(true);
  });

  it('rejects confirmation_code with spaces', () => {
    const result = confirmDeliverySchema.safeParse({
      ...validDelivery,
      confirmation_code: '123 56',
    });
    expect(result.success).toBe(false);
  });

  it('accepts confirmation_code "000000"', () => {
    const result = confirmDeliverySchema.safeParse({
      ...validDelivery,
      confirmation_code: '000000',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. searchListingsSchema
// ---------------------------------------------------------------------------
describe('searchListingsSchema', () => {
  it('accepts empty object (all fields optional with defaults)', () => {
    const result = searchListingsSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data!.page).toBe(1);
    expect(result.data!.per_page).toBe(20);
    expect(result.data!.sort_by).toBe('departure_date');
    expect(result.data!.sort_order).toBe('asc');
  });

  it('accepts full search parameters', () => {
    const result = searchListingsSchema.safeParse({
      departure_country: 'France',
      arrival_country: 'Sénégal',
      min_kg: 5,
      max_price: 15,
      departure_after: '2025-07-01',
      departure_before: '2025-08-01',
      page: 2,
      per_page: 10,
      sort_by: 'price_per_kg',
      sort_order: 'desc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects page less than 1', () => {
    const result = searchListingsSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts page exactly 1', () => {
    const result = searchListingsSchema.safeParse({ page: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects per_page less than 1', () => {
    const result = searchListingsSchema.safeParse({ per_page: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts per_page exactly 1', () => {
    const result = searchListingsSchema.safeParse({ per_page: 1 });
    expect(result.success).toBe(true);
  });

  it('accepts per_page exactly 50', () => {
    const result = searchListingsSchema.safeParse({ per_page: 50 });
    expect(result.success).toBe(true);
  });

  it('rejects per_page greater than 50', () => {
    const result = searchListingsSchema.safeParse({ per_page: 51 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer page', () => {
    const result = searchListingsSchema.safeParse({ page: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer per_page', () => {
    const result = searchListingsSchema.safeParse({ per_page: 10.5 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sort_by value', () => {
    const result = searchListingsSchema.safeParse({ sort_by: 'invalid_field' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid sort_by values', () => {
    for (const field of ['departure_date', 'price_per_kg', 'available_kg', 'created_at'] as const) {
      const result = searchListingsSchema.safeParse({ sort_by: field });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid sort_order value', () => {
    const result = searchListingsSchema.safeParse({ sort_order: 'random' });
    expect(result.success).toBe(false);
  });

  it('accepts both asc and desc sort_order', () => {
    for (const order of ['asc', 'desc'] as const) {
      const result = searchListingsSchema.safeParse({ sort_order: order });
      expect(result.success).toBe(true);
    }
  });

  it('rejects negative min_kg', () => {
    const result = searchListingsSchema.safeParse({ min_kg: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts min_kg of 0', () => {
    const result = searchListingsSchema.safeParse({ min_kg: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects negative max_price', () => {
    const result = searchListingsSchema.safeParse({ max_price: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts max_price of 0', () => {
    const result = searchListingsSchema.safeParse({ max_price: 0 });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. createCheckoutSchema
// ---------------------------------------------------------------------------
describe('createCheckoutSchema', () => {
  it('accepts valid request_id', () => {
    const result = createCheckoutSchema.safeParse({ request_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('rejects missing request_id', () => {
    const result = createCheckoutSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid request_id', () => {
    const result = createCheckoutSchema.safeParse({ request_id: 'not-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string request_id', () => {
    const result = createCheckoutSchema.safeParse({ request_id: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. refundSchema
// ---------------------------------------------------------------------------
describe('refundSchema', () => {
  it('accepts valid request_id', () => {
    const result = refundSchema.safeParse({ request_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('rejects missing request_id', () => {
    const result = refundSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid request_id', () => {
    const result = refundSchema.safeParse({ request_id: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects numeric request_id', () => {
    const result = refundSchema.safeParse({ request_id: 12345 });
    expect(result.success).toBe(false);
  });

  it('rejects null request_id', () => {
    const result = refundSchema.safeParse({ request_id: null });
    expect(result.success).toBe(false);
  });
});
