// ============================================
// Akiri - Type Definitions
// ============================================

// --- User & Profile ---
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  id_verification_status: 'none' | 'pending' | 'verified' | 'failed';
  id_verified_at: string | null;
  verification_level: 1 | 2 | 3;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  id_verified: boolean;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarded: boolean;
  rating: number;
  total_reviews: number;
  total_trips: number;
  total_shipments: number;
  created_at: string;
  updated_at: string;
}

// --- Listing (Annonce) ---
export type ListingStatus = 'active' | 'full' | 'completed' | 'cancelled';

export interface Listing {
  id: string;
  traveler_id: string;
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  departure_date: string;
  arrival_date: string | null;
  available_kg: number;
  price_per_kg: number;
  currency: string;
  description: string | null;
  accepted_items: string[];
  refused_items: string[];
  collection_points: string[];
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  // Joined
  traveler?: Profile;
}

// --- Shipment Request (Demande) ---
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'paid'
  | 'collected'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'disputed'
  | 'cancelled';

export interface ShipmentRequest {
  id: string;
  listing_id: string;
  sender_id: string;
  weight_kg: number;
  item_description: string;
  item_photos: string[];
  special_instructions: string | null;
  status: RequestStatus;
  total_price: number;
  confirmation_code: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  listing?: Listing;
  sender?: Profile;
}

// --- Parcel Posting (sender publishes a parcel) ---

export type ParcelCategory =
  | 'clothing'
  | 'electronics'
  | 'food'
  | 'documents'
  | 'cosmetics'
  | 'other';

export type UrgencyLevel = 'flexible' | 'within_2_weeks' | 'urgent';

export type ParcelStatus = 'active' | 'matched' | 'in_progress' | 'completed' | 'cancelled';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ParcelPosting {
  id: string;
  sender_id: string;
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  weight_kg: number;
  description: string;
  category: ParcelCategory;
  photos: string[];
  budget_per_kg: number | null;
  urgency: UrgencyLevel;
  is_fragile: boolean;
  desired_date: string | null;
  status: ParcelStatus;
  created_at: string;
  updated_at: string;
  // Joined
  sender?: Profile;
}

export interface CarryOffer {
  id: string;
  parcel_id: string;
  traveler_id: string;
  listing_id: string | null;
  proposed_price: number;
  departure_date: string;
  message: string | null;
  status: OfferStatus;
  created_at: string;
  // Joined
  parcel?: ParcelPosting;
  traveler?: Profile;
  listing?: Listing;
}

// --- Transaction ---
export type TransactionStatus = 'pending' | 'held' | 'released' | 'refunded' | 'disputed';

export interface Transaction {
  id: string;
  request_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  platform_fee: number;
  payout_amount: number | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

// --- Review ---
export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  request_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Joined
  reviewer?: Profile;
}

// --- Message ---
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: 'text' | 'image' | 'voice' | 'system';
  media_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  request_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  // Joined
  participants?: Profile[];
  request?: ShipmentRequest;
}

// --- Notification ---
export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'payment_received'
  | 'parcel_collected'
  | 'parcel_delivered'
  | 'delivery_confirmed'
  | 'new_review'
  | 'new_message';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// --- Corridor ---
export interface Corridor {
  departure_country: string;
  arrival_country: string;
  active_listings: number;
  avg_price_per_kg: number;
}

// --- API Response ---
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// --- Verification ---
export type VerificationSessionType = 'phone' | 'identity';
export type VerificationProvider = 'mock' | 'stripe' | 'twilio';
export type VerificationStatus = 'pending' | 'processing' | 'verified' | 'failed' | 'expired';

export interface VerificationSession {
  id: string;
  user_id: string;
  type: VerificationSessionType;
  provider: VerificationProvider;
  external_session_id: string | null;
  status: VerificationStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}
