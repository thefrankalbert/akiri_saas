// ============================================
// Akiri - Constants
// ============================================

export const APP_NAME = 'Akiri';
export const APP_DESCRIPTION = 'Transport collaboratif de colis pour la diaspora africaine';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Platform fee percentage
export const PLATFORM_FEE_PERCENT = 10;

// Limits
export const MAX_WEIGHT_KG = 30;
export const MIN_PRICE_PER_KG = 1;
export const MAX_PHOTOS_PER_REQUEST = 5;
export const MAX_FILE_SIZE_MB = 5;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Supported countries (initial corridors)
export const SUPPORTED_COUNTRIES = [
  { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'CM', name: 'Cameroun', flag: '\u{1F1E8}\u{1F1F2}' },
  { code: 'SN', name: 'S\u00e9n\u00e9gal', flag: '\u{1F1F8}\u{1F1F3}' },
  { code: 'CI', name: "C\u00f4te d'Ivoire", flag: '\u{1F1E8}\u{1F1EE}' },
  { code: 'CD', name: 'RD Congo', flag: '\u{1F1E8}\u{1F1E9}' },
  { code: 'ML', name: 'Mali', flag: '\u{1F1F2}\u{1F1F1}' },
  { code: 'GA', name: 'Gabon', flag: '\u{1F1EC}\u{1F1E6}' },
  { code: 'BF', name: 'Burkina Faso', flag: '\u{1F1E7}\u{1F1EB}' },
  { code: 'GN', name: 'Guin\u00e9e', flag: '\u{1F1EC}\u{1F1F3}' },
  { code: 'TG', name: 'Togo', flag: '\u{1F1F9}\u{1F1EC}' },
  { code: 'BJ', name: 'B\u00e9nin', flag: '\u{1F1E7}\u{1F1EF}' },
  { code: 'MG', name: 'Madagascar', flag: '\u{1F1F2}\u{1F1EC}' },
  { code: 'BE', name: 'Belgique', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'US', name: '\u00c9tats-Unis', flag: '\u{1F1FA}\u{1F1F8}' },
] as const;

// Accepted item categories
export const ITEM_CATEGORIES = [
  'V\u00eatements',
  'Chaussures',
  '\u00c9lectronique',
  'Cosm\u00e9tiques',
  'M\u00e9dicaments',
  'Alimentation',
  'Documents',
  'Jouets',
  'Livres',
  'Autres',
] as const;

// Parcel categories
export const PARCEL_CATEGORIES = [
  { value: 'clothing', label: 'Vetements' },
  { value: 'electronics', label: 'Electronique' },
  { value: 'food', label: 'Alimentaire' },
  { value: 'documents', label: 'Documents' },
  { value: 'cosmetics', label: 'Cosmetiques' },
  { value: 'other', label: 'Autre' },
] as const;

export const URGENCY_LEVELS = [
  { value: 'flexible', label: 'Flexible', color: 'text-surface-100' },
  { value: 'within_2_weeks', label: '< 2 semaines', color: 'text-warning' },
  { value: 'urgent', label: 'Urgent', color: 'text-error' },
] as const;

export const PARCEL_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  matched: 'Matche',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

export const PARCEL_STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success',
  matched: 'bg-primary-500/10 text-primary-400',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-surface-600 text-surface-200',
  cancelled: 'bg-error/10 text-error',
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Acceptee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
};

export const OFFER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100/10 text-warning',
  accepted: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
  cancelled: 'bg-surface-600 text-surface-200',
};

export const MAX_PARCEL_PHOTOS = 3;
export const MAX_PARCEL_WEIGHT_KG = 30;

// Request status labels (FR)
export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Accept\u00e9e',
  paid: 'Pay\u00e9e',
  collected: 'Collect\u00e9e',
  in_transit: 'En transit',
  delivered: 'Livr\u00e9e',
  confirmed: 'Confirm\u00e9e',
  disputed: 'Litige',
  cancelled: 'Annul\u00e9e',
};

// Request status colors
export const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  collected: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-teal-100 text-teal-800',
  confirmed: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};
