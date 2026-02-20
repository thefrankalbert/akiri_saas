# Design — Refonte Esthétique Totale Akiri

**Date :** 2026-02-20
**Approche :** A — Refonte totale des composants
**Inspiration :** Stripe, Linear, Vercel, Notion

---

## Direction

- **Ambiance** : Premium & Épuré
- **Mode** : Hybride (dark landing + light app)
- **Couleur accent** : Indigo/Violet (`#6366F1`)
- **Icônes** : Phosphor Icons duotone (remplace Lucide)

---

## 1. Design System & Tokens

### Palette

| Token     | Valeur                       | Usage                           |
| --------- | ---------------------------- | ------------------------------- |
| `primary` | Indigo `#6366F1` (11 shades) | CTAs, liens, éléments actifs    |
| `accent`  | Violet `#8B5CF6`             | Gradients, glow, highlights     |
| `success` | Emerald `#10B981`            | Confirmations, statuts positifs |
| `warning` | Amber `#F59E0B`              | Alertes, deadlines proches      |
| `error`   | Rose `#F43F5E`               | Erreurs                         |
| `neutral` | Zinc scale                   | Texte, bordures, surfaces       |

### Surfaces

- **Landing (dark)** : bg `#09090B` (zinc-950), cards `#18181B` (zinc-900) + `border-white/5`
- **App (light)** : bg `#FAFAFA` (zinc-50), cards `#FFFFFF` + `shadow-xs border-zinc-200/60`

### Typography

- Font: Inter (conservé) avec font-feature-settings agressifs
- Headings: `font-semibold` + `tracking-tight`
- Body: `text-sm` mobile, `text-base` desktop

### Radius

`rounded-lg` (8px) par défaut — uniforme partout.

### Shadows (light mode)

- Cards: `shadow-xs` + border
- Elevated: `shadow-sm` + border
- Hover: `shadow-md` transition

### Effets (dark sections)

- Glow indigo: `box-shadow: 0 0 80px rgba(99,102,241,0.15)`
- Gradient mesh subtil en background
- Borders: `border-white/5`

---

## 2. Composants UI

### Button

- Primary: `bg-primary-500 text-white`, hover `bg-primary-600`
- Secondary: `bg-zinc-100 text-zinc-900`, hover `bg-zinc-200`
- Ghost: `text-zinc-500`, hover `bg-zinc-100`
- Outline: `border-zinc-200 text-zinc-700`, hover `bg-zinc-50`
- Sizes: `h-8 px-3` (sm), `h-9 px-4` (md), `h-10 px-5` (lg)
- Radius: `rounded-lg` — Transition: `duration-150`

### Card

- Light: `bg-white border border-zinc-200/60 rounded-lg shadow-xs`
- Dark: `bg-zinc-900 border border-white/5 rounded-lg`
- Hover: `shadow-sm` + `border-zinc-300` (light) / `border-white/10` (dark)
- Pas de translate-y hover

### Badge

- Pill avec fond léger: `bg-primary-50 text-primary-700 ring-1 ring-primary-200/50`
- Success: `bg-emerald-50 text-emerald-700`
- Compact: `text-xs px-2 py-0.5 rounded-md`

### Input

- `border-zinc-300 rounded-lg h-9`
- Focus: `ring-2 ring-primary-500/20 border-primary-500`

### Avatar

- Border subtil, badge vérifié = dot `bg-emerald-500`

### Skeleton

- `bg-zinc-100` gradient doux

---

## 3. Pages

### Landing (dark)

- Hero: zinc-950, gradient mesh indigo/violet subtil
- Titre: blanc pur, `text-5xl sm:text-7xl font-semibold tracking-tight`
- Sous-titre: `text-zinc-400`
- CTAs: primary indigo + ghost `text-white border-white/10`
- Animations rapides (200ms fade-in), pas d'opacity-0 au load
- Trust signals: Phosphor duotone dans `bg-white/5`
- Live ticker: `bg-emerald-500/10 text-emerald-400`

### Dashboard (light)

- Stats: 4 cards, Phosphor duotone dans carré coloré arrondi
- Quick actions: cards horizontales, `hover:bg-zinc-50`
- Activity: liste simple, divide-y, pas de cards imbriquées
- Pas de HoverScale/StaggerContainer — `transition-colors` only

### Annonces (light)

- Selects natifs stylés (appearance-none + chevron CSS)
- Cards: route + prix + avatar, hover `border-primary-200`

### Corridors (light)

- Cards corridor: drapeaux shrink-0 + villes + stats
- Feed: timeline avec dots

---

## 4. Migration Icônes

| Lucide            | Phosphor (duotone)  |
| ----------------- | ------------------- |
| ArrowRight        | ArrowRight          |
| Package           | Package             |
| Plane             | AirplaneTilt        |
| Globe             | GlobeHemisphereWest |
| Shield            | ShieldCheck         |
| Star              | Star                |
| MessageCircle     | ChatCircle          |
| Search            | MagnifyingGlass     |
| Calendar          | CalendarBlank       |
| MapPin            | MapPin              |
| TrendingUp        | TrendUp             |
| Plus              | Plus                |
| CheckCircle2      | CheckCircle         |
| SlidersHorizontal | Sliders             |
| AlertCircle       | WarningCircle       |
| Sparkles          | Sparkle             |
| Clock             | Clock               |
| ChevronRight      | CaretRight          |
| ChevronDown       | CaretDown           |
| Radio             | Broadcast           |
| Users             | UsersThree          |
| Minus             | Minus               |
| Zap               | Lightning           |
| ArrowDown         | ArrowDown           |

---

## 5. Fichiers impactés (~25)

| Couche  | Fichiers                                                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config  | `package.json` (+`@phosphor-icons/react`)                                                                                                                            |
| Tokens  | `globals.css`                                                                                                                                                        |
| UI      | `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Avatar.tsx`, `Skeleton.tsx`, `Modal.tsx`, `Tabs.tsx`, `Motion.tsx`                                              |
| Layout  | `Header.tsx`, `Footer.tsx`, `BottomNav.tsx`                                                                                                                          |
| Landing | `HeroSection.tsx`, `LiveTicker.tsx`, `AnimatedStats.tsx`, `HowItWorks.tsx`, `FeaturesSection.tsx`, `TestimonialsSection.tsx`, `CorridorsSection.tsx`, `FinalCTA.tsx` |
| App     | `DashboardPage.tsx`, `ListingsPage.tsx`, `CorridorsPage.tsx`                                                                                                         |
