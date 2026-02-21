# Sender Parcel Posting — Marketplace Bilateral Design

> **Date :** 2026-02-21
> **Statut :** Approuve
> **Approche :** Marketplace Miroir (nouvelles tables, symetrie avec le flux existant)

## Objectif

Permettre aux expediteurs de publier des colis a envoyer pour que les voyageurs les decouvrent et proposent leurs kilos. Transforme Akiri d'un marketplace unidirectionnel (voyageurs publient) en marketplace bilateral (les deux cotes publient).

## Decisions cles

| Decision         | Choix                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Pricing          | Budget indicatif optionnel (expediteur) + offre libre (voyageur)      |
| Reponse voyageur | Offre directe OU message d'abord, au choix                            |
| Navigation       | Lien "Colis" dans Sidebar, sous-onglet dans Annonces                  |
| Formulaire       | Un seul formulaire unifie avec toggle "Kilos dispo / Colis a envoyer" |
| Matching         | Auto : scoring corridor + notifications bilaterales                   |
| Calendrier       | react-day-picker remplace input[type=date] partout                    |

## Modele de donnees

### Table `parcel_postings`

| Colonne           | Type               | Description                                              |
| ----------------- | ------------------ | -------------------------------------------------------- |
| id                | uuid PK            |                                                          |
| sender_id         | uuid FK → profiles | Expediteur                                               |
| departure_city    | text               | Ville depart                                             |
| departure_country | text               | Pays depart                                              |
| arrival_city      | text               | Ville arrivee                                            |
| arrival_country   | text               | Pays arrivee                                             |
| weight_kg         | numeric            | Poids estime                                             |
| description       | text               | Description du contenu                                   |
| category          | text               | clothing, electronics, food, documents, cosmetics, other |
| photos            | text[]             | URLs photos (1-3, Supabase Storage)                      |
| budget_per_kg     | numeric nullable   | Budget indicatif EUR/kg                                  |
| urgency           | text               | flexible, within_2_weeks, urgent                         |
| is_fragile        | boolean            | Mention fragile — manipulation delicate                  |
| desired_date      | date nullable      | Date souhaitee                                           |
| status            | text               | active, matched, in_progress, completed, cancelled       |
| created_at        | timestamptz        |                                                          |
| updated_at        | timestamptz        |                                                          |

### Table `carry_offers`

| Colonne        | Type                        | Description                            |
| -------------- | --------------------------- | -------------------------------------- |
| id             | uuid PK                     |                                        |
| parcel_id      | uuid FK → parcel_postings   | Colis vise                             |
| traveler_id    | uuid FK → profiles          | Voyageur                               |
| listing_id     | uuid FK nullable → listings | Lien vers annonce existante            |
| proposed_price | numeric                     | Prix propose total                     |
| departure_date | date                        | Date depart voyageur                   |
| message        | text nullable               | Message d'accompagnement               |
| status         | text                        | pending, accepted, rejected, cancelled |
| created_at     | timestamptz                 |                                        |

### Flux apres acceptation

1. Expediteur accepte une offre
2. `shipment_request` cree automatiquement (lie au listing du voyageur)
3. Paiement escrow demarre → flux existant identique
4. `parcel_posting.status` → matched

## Formulaire unifie

### Contrainte : zero scroll sur mobile/tablette

Tout tient dans `100dvh - 8rem` (header + BottomNav). Techniques :

- 2 champs par ligne (ville+pays, poids+categorie, urgence+fragile)
- Placeholders au lieu de labels sur champs evidents
- Inputs compacts h-10
- Espacement gap-2.5
- Photos en strip horizontal h-16 w-16

### Toggle en haut

Pill selector anime : "Kilos disponibles" | "Colis a envoyer". Le fond bg-primary-500 glisse (transition 200ms). La section dynamique fait un fade+slideY(4px) 150ms.

### Champs communs (les deux types)

- Ville depart + pays depart (1 ligne)
- Ville arrivee + pays arrivee (1 ligne)
- Date (calendrier visuel DatePicker)

### Champs "Kilos disponibles" (existants)

- Kilos dispo + Prix/kg (1 ligne)
- Articles acceptes (chips)
- Points de collecte
- Description (optionnel, 2 lignes)

### Champs "Colis a envoyer" (nouveaux)

- Poids estime + Categorie (1 ligne)
- Description du colis (2 lignes)
- Photos (strip 3 miniatures + bouton +)
- Urgence (3 pills : Flexible / < 2 semaines / Urgent) + Fragile (switch) — 1 ligne
- Budget indicatif EUR/kg (optionnel)

### Bouton

- "Publier mon annonce" (kilos) / "Publier mon colis" (colis)
- Full-width, gradient primary, shadow-glow

### Tablette/Desktop

Formulaire centre dans `max-w-lg mx-auto`, meme layout compact.

## DatePicker — Remplacement global

Nouveau composant `src/components/ui/DatePicker.tsx` :

- Lib : react-day-picker + date-fns (deja installe) locale fr
- Bouton affichant la date formatee ("21 fevrier 2026")
- Au clic → popover avec calendrier visuel (grille mois, navigation)
- Jours passes grises (non selectionnables)
- Style dark theme coherent
- Remplace input[type=date] dans NewListingForm ET partout ailleurs

## Matching automatique

### A la publication d'un colis

1. Query listings actifs meme corridor (departure_country → arrival_country)
2. Score :
   - Meme ville depart/arrivee → +3 pts
   - Meme pays (ville differente) → +1 pt
   - Kilos dispo >= poids colis → +2 pts
   - Date depart <= date souhaitee → +2 pts
   - Prix/kg <= budget expediteur → +1 pt
3. Top 5 matchs affiches a l'expediteur
4. Notification aux voyageurs matches

### A la publication d'un listing

Meme logique inversee : notifie les expediteurs avec colis compatibles.

### Implementation

- `src/lib/services/matching.ts` — fonction `findMatches()`
- Query SQL simple avec scoring, pas de table dediee
- Appele au POST parcels ET POST listings

## Pages colis

### `/colis` — ParcelsPage

- Header "Colis a envoyer" + compteur
- Filtres : corridor (pays), poids min/max, urgence, categorie
- Grille ParcelCard : badges (categorie, urgence, fragile), route, poids, budget, photo miniature, avatar expediteur

### `/colis/[id]` — ParcelDetail

- Photos carousel horizontal
- Infos completes : route, poids, categorie, description, urgence, fragile
- Profil expediteur
- 2 boutons (voyageur) : "Proposer mes kilos" (MakeOfferModal) + "Contacter" (chat)
- Section "Voyageurs compatibles" (matching auto, visible par l'expediteur)
- Section "Offres recues" (liste carry_offers, boutons Accepter/Refuser)

## Navigation

- **BottomNav** : bouton "+" inchange, mene au formulaire unifie
- **Sidebar** : lien "Colis" ajoute sous "Annonces"
- **Page Annonces** : sous-onglet "Colis a envoyer" redirige vers /colis
- **Constants** : nav item ajoute dans la config

## Fichiers a creer

| Fichier                                                | Role                            |
| ------------------------------------------------------ | ------------------------------- |
| `supabase/migrations/parcel_postings.sql`              | Tables + RLS                    |
| `src/app/api/parcels/route.ts`                         | GET liste + POST creer          |
| `src/app/api/parcels/[id]/route.ts`                    | GET detail + PATCH status       |
| `src/app/api/parcels/[id]/offers/route.ts`             | GET offres + POST offre         |
| `src/app/api/parcels/upload/route.ts`                  | Upload photos                   |
| `src/lib/services/parcels.ts`                          | CRUD parcel_postings            |
| `src/lib/services/offers.ts`                           | CRUD carry_offers + acceptation |
| `src/lib/services/matching.ts`                         | Scoring + matchs                |
| `src/lib/hooks/use-parcels.ts`                         | Liste + filtres + realtime      |
| `src/lib/hooks/use-parcel-detail.ts`                   | Detail + offres                 |
| `src/components/ui/DatePicker.tsx`                     | Calendrier visuel               |
| `src/components/ui/TypeToggle.tsx`                     | Pill toggle anime               |
| `src/components/ui/PhotoUpload.tsx`                    | Strip upload photos             |
| `src/app/(main)/colis/page.tsx`                        | Route /colis                    |
| `src/app/(main)/colis/[id]/page.tsx`                   | Route /colis/[id]               |
| `src/components/features/parcels/ParcelsPage.tsx`      | Liste + filtres                 |
| `src/components/features/parcels/ParcelCard.tsx`       | Card grille                     |
| `src/components/features/parcels/ParcelDetail.tsx`     | Page detail                     |
| `src/components/features/parcels/MakeOfferModal.tsx`   | Modale offre                    |
| `src/components/features/parcels/OfferCard.tsx`        | Card offre recue                |
| `src/components/features/parcels/MatchedTravelers.tsx` | Voyageurs compatibles           |

## Fichiers a modifier

| Fichier                                               | Changement                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| `src/types/index.ts`                                  | Types ParcelPosting, CarryOffer, ParcelCategory, UrgencyLevel |
| `src/lib/validations/index.ts`                        | Schema parcelPostingSchema, carryOfferSchema                  |
| `src/lib/mock-data.ts`                                | mockParcelPostings, mockCarryOffers                           |
| `src/components/features/listings/NewListingForm.tsx` | Toggle + section colis dynamique                              |
| `src/constants/index.ts`                              | Nav item "Colis", categories, urgency levels                  |
| `src/components/layout/Sidebar.tsx`                   | Lien "Colis"                                                  |
| `src/lib/hooks/index.ts`                              | Exports nouveaux hooks                                        |

## Dependance nouvelle

- `react-day-picker` — calendrier visuel (remplace input[type=date])

## Ce qui ne change pas

- Flux escrow/paiement existant
- Pages existantes (annonces, demandes, messages)
- BottomNav (bouton "+" identique)
