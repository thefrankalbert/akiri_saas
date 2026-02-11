// ============================================
// Toast Notification Utility (Sonner wrapper)
// ============================================

import { toast } from 'sonner';

// ─── Auth ──────────────────────────────────────────────────
export const toasts = {
  // Auth
  loginSuccess: () =>
    toast.success('Connexion r\u00e9ussie', { description: 'Bienvenue sur Akiri !' }),
  registerSuccess: () =>
    toast.success('Inscription r\u00e9ussie', {
      description: 'V\u00e9rifiez votre email pour activer votre compte.',
    }),
  logoutSuccess: () => toast.success('D\u00e9connexion r\u00e9ussie'),
  resetPasswordSent: () =>
    toast.success('Email envoy\u00e9', {
      description: 'Consultez votre bo\u00eete mail pour r\u00e9initialiser votre mot de passe.',
    }),

  // Listings
  listingCreated: () =>
    toast.success('Annonce publi\u00e9e', { description: 'Votre annonce est maintenant visible.' }),
  listingUpdated: () => toast.success('Annonce mise \u00e0 jour'),
  listingCancelled: () => toast.success('Annonce annul\u00e9e'),

  // Requests
  requestCreated: () =>
    toast.success('Demande envoy\u00e9e', {
      description: 'Le voyageur sera notifi\u00e9 de votre demande.',
    }),
  requestAccepted: () =>
    toast.success('Demande accept\u00e9e', {
      description: 'Proc\u00e9dez au paiement pour confirmer.',
    }),
  requestCancelled: () => toast.info('Demande annul\u00e9e'),
  deliveryConfirmed: () =>
    toast.success('Livraison confirm\u00e9e !', {
      description: 'Le paiement sera lib\u00e9r\u00e9 au voyageur.',
    }),

  // Reviews
  reviewCreated: () =>
    toast.success('Avis publi\u00e9', { description: 'Merci pour votre retour !' }),

  // Messages
  messageSent: () => toast.success('Message envoy\u00e9'),

  // Profile
  profileUpdated: () => toast.success('Profil mis \u00e0 jour'),
  avatarUpdated: () => toast.success('Photo de profil mise \u00e0 jour'),

  // Generic
  genericError: (message?: string) =>
    toast.error('Une erreur est survenue', {
      description: message || 'Veuillez r\u00e9essayer plus tard.',
    }),
  networkError: () =>
    toast.error('Erreur de connexion', {
      description: 'V\u00e9rifiez votre connexion internet.',
    }),
  unauthorized: () =>
    toast.error('Non autoris\u00e9', {
      description: 'Veuillez vous connecter pour continuer.',
    }),
  notFound: () => toast.error('Ressource introuvable'),
  validationError: (message: string) =>
    toast.error('Erreur de validation', { description: message }),

  // Payments
  paymentSuccess: () =>
    toast.success('Paiement effectu\u00e9', {
      description: 'Votre paiement a \u00e9t\u00e9 autoris\u00e9 avec succ\u00e8s.',
    }),
  paymentFailed: () =>
    toast.error('Paiement \u00e9chou\u00e9', {
      description: 'Le paiement a \u00e9chou\u00e9. Veuillez r\u00e9essayer.',
    }),
  refundSuccess: () =>
    toast.success('Remboursement effectu\u00e9', {
      description: 'Le remboursement a \u00e9t\u00e9 trait\u00e9 avec succ\u00e8s.',
    }),
  paymentReleased: () =>
    toast.success('Paiement lib\u00e9r\u00e9', {
      description: 'Le paiement a \u00e9t\u00e9 lib\u00e9r\u00e9 au voyageur.',
    }),

  // Clipboard
  copiedToClipboard: () => toast.success('Copi\u00e9 !'),
} as const;
