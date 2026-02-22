// ============================================
// Akiri - Zod Validation Schemas
// ============================================

import { z } from 'zod/v4';
import { MAX_WEIGHT_KG, MIN_PRICE_PER_KG, MAX_PARCEL_WEIGHT_KG } from '@/constants';

// ─── Auth Schemas ───────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    last_name: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    email: z.email('Adresse email invalide'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
      ),
    confirm_password: z.string(),
    accept_terms: z.literal(true, {
      error: 'Vous devez accepter les conditions générales',
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Profile Schemas ────────────────────────────────────────

export const updateProfileSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50).optional(),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Numéro de téléphone invalide')
    .nullable()
    .optional(),
  bio: z.string().max(500, 'La bio ne peut pas dépasser 500 caractères').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Listing Schemas ────────────────────────────────────────

export const createListingSchema = z
  .object({
    departure_city: z.string().min(2, 'Ville de départ requise'),
    departure_country: z.string().min(2, 'Pays de départ requis'),
    arrival_city: z.string().min(2, "Ville d'arrivée requise"),
    arrival_country: z.string().min(2, "Pays d'arrivée requis"),
    departure_date: z.string().refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'La date de départ doit être dans le futur' }
    ),
    arrival_date: z.string().nullable().optional(),
    available_kg: z
      .number()
      .min(1, 'Minimum 1 kg')
      .max(MAX_WEIGHT_KG, `Maximum ${MAX_WEIGHT_KG} kg`),
    price_per_kg: z.number().min(MIN_PRICE_PER_KG, `Minimum ${MIN_PRICE_PER_KG} EUR/kg`),
    currency: z.string(),
    description: z.string().max(1000, 'Description trop longue').nullable().optional(),
    accepted_items: z.array(z.string()).min(1, 'Sélectionnez au moins une catégorie'),
    refused_items: z.array(z.string()).optional(),
    collection_points: z
      .array(z.string().min(3, 'Point de collecte trop court'))
      .min(1, 'Ajoutez au moins un point de collecte'),
  })
  .refine(
    (data) => {
      if (data.arrival_date) {
        return new Date(data.arrival_date) > new Date(data.departure_date);
      }
      return true;
    },
    {
      message: "La date d'arrivée doit être après la date de départ",
      path: ['arrival_date'],
    }
  );

export type CreateListingInput = z.infer<typeof createListingSchema>;

// ─── Shipment Request Schemas ───────────────────────────────

export const createRequestSchema = z.object({
  listing_id: z.string().uuid("ID d'annonce invalide"),
  weight_kg: z
    .number()
    .min(0.5, 'Minimum 0.5 kg')
    .max(MAX_WEIGHT_KG, `Maximum ${MAX_WEIGHT_KG} kg`),
  item_description: z
    .string()
    .min(10, 'D\u00e9crivez votre colis en au moins 10 caract\u00e8res')
    .max(500, 'Description trop longue'),
  item_photos: z.array(z.string().url()).max(5, 'Maximum 5 photos').optional().default([]),
  special_instructions: z.string().max(500, 'Instructions trop longues').nullable().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

// ─── Parcel Posting Schemas ─────────────────────────────────

export const createParcelPostingSchema = z.object({
  departure_city: z.string().min(2, 'Ville de depart requise'),
  departure_country: z.string().min(2, 'Pays de depart requis'),
  arrival_city: z.string().min(2, "Ville d'arrivee requise"),
  arrival_country: z.string().min(2, "Pays d'arrivee requis"),
  weight_kg: z
    .number()
    .min(0.5, 'Minimum 0.5 kg')
    .max(MAX_PARCEL_WEIGHT_KG, `Maximum ${MAX_PARCEL_WEIGHT_KG} kg`),
  description: z
    .string()
    .min(10, 'Decrivez votre colis en au moins 10 caracteres')
    .max(500, 'Description trop longue'),
  category: z.enum(['clothing', 'electronics', 'food', 'documents', 'cosmetics', 'other'], {
    error: 'Categorie requise',
  }),
  photos: z.array(z.string().url()).max(3, 'Maximum 3 photos').optional().default([]),
  budget_per_kg: z.number().min(1, 'Minimum 1 EUR/kg').nullable().optional(),
  urgency: z.enum(['flexible', 'within_2_weeks', 'urgent']).default('flexible'),
  is_fragile: z.boolean().default(false),
  desired_date: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: 'La date souhaitee doit etre dans le futur' }
    ),
});

export type CreateParcelPostingInput = z.infer<typeof createParcelPostingSchema>;

export const createCarryOfferSchema = z.object({
  parcel_id: z.string().uuid('ID de colis invalide'),
  listing_id: z.string().uuid("ID d'annonce invalide").nullable().optional(),
  proposed_price: z.number().min(1, 'Minimum 1 EUR'),
  departure_date: z.string().refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: 'La date de depart doit etre dans le futur' }
  ),
  message: z.string().max(500, 'Message trop long').nullable().optional(),
});

export type CreateCarryOfferInput = z.infer<typeof createCarryOfferSchema>;

export const searchParcelsSchema = z.object({
  departure_country: z.string().optional(),
  arrival_country: z.string().optional(),
  min_kg: z.number().min(0).optional(),
  max_kg: z.number().min(0).optional(),
  category: z.string().optional(),
  urgency: z.string().optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(50).default(20),
  sort_by: z.enum(['created_at', 'weight_kg', 'urgency', 'budget_per_kg']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchParcelsInput = z.infer<typeof searchParcelsSchema>;

// ─── Review Schemas ─────────────────────────────────────────

export const createReviewSchema = z.object({
  request_id: z.string().uuid('ID de demande invalide'),
  reviewed_id: z.string().uuid("ID de l'utilisateur invalide"),
  rating: z.number().int().min(1, 'Note minimale : 1').max(5, 'Note maximale : 5'),
  comment: z.string().max(1000, 'Commentaire trop long').nullable().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ─── Message Schemas ────────────────────────────────────────

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid('ID de conversation invalide'),
  content: z.string().min(1, 'Le message ne peut pas être vide').max(2000, 'Message trop long'),
  content_type: z.enum(['text', 'image', 'voice', 'system']).default('text'),
  media_url: z.string().url('URL invalide').nullable().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ─── Confirmation Code Schema ───────────────────────────────

export const confirmDeliverySchema = z.object({
  request_id: z.string().uuid('ID de demande invalide'),
  confirmation_code: z
    .string()
    .length(6, 'Le code doit contenir exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
});

export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;

// ─── Search / Filter Schemas ────────────────────────────────

export const searchListingsSchema = z.object({
  departure_country: z.string().optional(),
  arrival_country: z.string().optional(),
  min_kg: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  departure_after: z.string().optional(),
  departure_before: z.string().optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(50).default(20),
  sort_by: z
    .enum(['departure_date', 'price_per_kg', 'available_kg', 'created_at'])
    .default('departure_date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export type SearchListingsInput = z.infer<typeof searchListingsSchema>;

// ─── Payment Schemas ──────────────────────────────────────

export const createCheckoutSchema = z.object({
  request_id: z.string().uuid('ID de demande invalide'),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

export const refundSchema = z.object({
  request_id: z.string().uuid('ID de demande invalide'),
});

export type RefundInput = z.infer<typeof refundSchema>;

// ─── Verification Schemas ──────────────────────────────────

export const sendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Numéro de téléphone invalide (format: +33612345678)'),
});

export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpSchema>;

export const verifyPhoneOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Numéro de téléphone invalide'),
  code: z
    .string()
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
});

export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;

export const createIdentitySessionSchema = z.object({
  return_url: z.string().url('URL de retour invalide').optional(),
});

export type CreateIdentitySessionInput = z.infer<typeof createIdentitySessionSchema>;
