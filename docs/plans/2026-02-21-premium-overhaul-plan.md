# Akiri Premium Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Akiri from a functional prototype into a Silicon Valley-grade mobile-first SaaS with Revolut-inspired dark aesthetic, fluid animations, and impeccable UX.

**Architecture:** Rebuild the design system foundations (tokens, typography, shadows) first, then rebuild each UI component, then recast every page top-to-bottom. Dark-first palette, Framer Motion animations everywhere, 44px touch targets, bottom-sheet modals on mobile.

**Tech Stack:** Next.js 16, Tailwind v4, Framer Motion, Radix UI, Phosphor Icons, Sonner

---

## Task 1: Design Tokens — Rewrite globals.css

**Files:**

- Modify: `src/app/globals.css` (entire file rewrite)

**Step 1: Rewrite the @theme block**

Replace the entire `@theme { ... }` block (lines 3-75) with the new Revolut Dark token system:

```css
@theme {
  /* Akiri Revolut Dark — Primary palette */
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6c5ce7;
  --color-primary-600: #5b4bd5;
  --color-primary-700: #4a3bc3;
  --color-primary-800: #3930a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;

  /* Accent — Violet */
  --color-accent-50: #f5f3ff;
  --color-accent-100: #ede9fe;
  --color-accent-200: #ddd6fe;
  --color-accent-300: #c4b5fd;
  --color-accent-400: #a78bfa;
  --color-accent-500: #8b5cf6;
  --color-accent-600: #7c3aed;
  --color-accent-700: #6d28d9;
  --color-accent-800: #5b21b6;
  --color-accent-900: #4c1d95;
  --color-accent-950: #2e1065;

  /* Surface — Dark scale for backgrounds */
  --color-surface-950: #0a0a0f;
  --color-surface-900: #0e0e15;
  --color-surface-800: #12121a;
  --color-surface-700: #1a1a25;
  --color-surface-600: #222230;
  --color-surface-500: #2a2a3c;
  --color-surface-400: #3a3a50;
  --color-surface-300: #4a4a64;
  --color-surface-200: #6a6a82;
  --color-surface-100: #8a8a9a;
  --color-surface-50: #b0b0c0;

  /* Neutral — Zinc scale (kept for light elements) */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f4f4f5;
  --color-neutral-200: #e4e4e7;
  --color-neutral-300: #d4d4d8;
  --color-neutral-400: #a1a1aa;
  --color-neutral-500: #71717a;
  --color-neutral-600: #52525b;
  --color-neutral-700: #3f3f46;
  --color-neutral-800: #27272a;
  --color-neutral-900: #18181b;
  --color-neutral-950: #09090b;

  /* Semantic */
  --color-success: #00d09c;
  --color-success-light: rgba(0, 208, 156, 0.1);
  --color-warning: #ffb800;
  --color-warning-light: rgba(255, 184, 0, 0.1);
  --color-error: #ff4757;
  --color-error-light: rgba(255, 71, 87, 0.1);
  --color-info: #3b82f6;
  --color-info-light: rgba(59, 130, 246, 0.1);

  /* Font */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows — Dark elevation system */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.6);
  --shadow-glow-primary: 0 0 20px rgba(108, 92, 231, 0.3);
  --shadow-glow-success: 0 0 20px rgba(0, 208, 156, 0.3);
}
```

**Step 2: Rewrite base styles**

Replace the `@layer base` block (lines 77-93):

```css
@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-tap-highlight-color: transparent;
    color-scheme: dark;
  }

  body {
    @apply bg-surface-950 text-neutral-100 antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11', 'kern', 'liga';
    letter-spacing: -0.011em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  *:focus-visible {
    @apply outline-primary-500 outline-2 outline-offset-2;
  }

  /* Safe area for mobile notch */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

**Step 3: Keep existing keyframe animations (lines 95-249) as-is**

They are reusable. No changes needed.

**Step 4: Add new utility classes at the end of the @layer utilities block**

After existing utilities (line 298), add:

```css
/* Typography scale */
.text-display {
  @apply text-5xl leading-[1.1] font-extrabold tracking-tight sm:text-6xl lg:text-7xl;
}
.text-h1 {
  @apply text-4xl leading-[1.15] font-bold tracking-tight lg:text-5xl;
}
.text-h2 {
  @apply text-2xl leading-[1.2] font-bold tracking-tight sm:text-3xl lg:text-4xl;
}
.text-h3 {
  @apply text-xl leading-[1.3] font-semibold sm:text-2xl;
}
.text-body {
  @apply text-base leading-relaxed font-normal;
}
.text-body-sm {
  @apply text-sm leading-relaxed font-normal;
}
.text-caption {
  @apply text-surface-100 text-xs font-medium;
}
.text-mono {
  @apply font-mono text-sm tabular-nums;
}

/* Elevation */
.elevation-0 {
  box-shadow: none;
}
.elevation-1 {
  @apply shadow-sm;
}
.elevation-2 {
  @apply shadow-md;
}
.elevation-3 {
  @apply shadow-lg;
}

/* Glass morphism */
.glass {
  @apply border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl;
}
.glass-strong {
  @apply border border-white/[0.12] bg-white/[0.06] backdrop-blur-2xl;
}
```

**Step 5: Verify**

Run: `pnpm build`
Expected: Build passes (colors/tokens are just CSS custom properties)

**Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style(tokens): rewrite design system — Revolut Dark palette, elevation, type scale"
```

---

## Task 2: Font Setup — Add JetBrains Mono

**Files:**

- Modify: `src/app/layout.tsx`

**Step 1: Add JetBrains Mono import and update Inter weights**

```typescript
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});
```

**Step 2: Update body className**

Change: `className={inter.variable}`
To: `className={\`${inter.variable} ${jetbrainsMono.variable}\`}`

**Step 3: Update viewport themeColor**

Change: `themeColor: '#F97316'` (orange — outdated)
To: `themeColor: '#0A0A0F'` (surface-950 — matches dark bg)

**Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "style(fonts): add JetBrains Mono, fix Inter weights, update themeColor"
```

---

## Task 3: Remove Lucide React — Replace with Phosphor

**Files (20 files need Lucide→Phosphor migration):**

- `src/components/ui/Modal.tsx` — X → X (Phosphor)
- `src/components/ui/Sheet.tsx` — X → X (Phosphor)
- `src/components/ui/DropdownMenu.tsx` — Check, ChevronRight, Circle
- `src/components/features/auth/LoginForm.tsx` — Mail, Lock, Eye, EyeOff, AlertTriangle
- `src/components/features/auth/RegisterForm.tsx` — Mail, Lock, Eye, EyeOff, User
- `src/components/features/auth/ResetPassword.tsx` — Mail, ArrowLeft, CheckCircle
- `src/components/features/auth/VerifyEmail.tsx` — Mail, ArrowLeft, RefreshCw
- `src/components/features/chat/MessagesPage.tsx` — MessageCircle, Search, Send
- `src/components/features/listings/ListingDetail.tsx` — multiple icons
- `src/components/features/listings/NewListingForm.tsx` — Plane, MapPin, Calendar, Package, Plus, X
- `src/components/features/pwa/InstallPrompt.tsx` — Download, X
- `src/components/features/transactions/TransactionsPage.tsx` — multiple
- `src/components/features/profile/ProfilePage.tsx` — Star, Shield, Calendar, ArrowLeft, Package, Plane
- `src/components/features/activity/ActivityFeedPage.tsx` — multiple
- `src/components/features/verification/IdentityVerification.tsx` — multiple
- `src/components/features/verification/VerificationBadge.tsx` — multiple
- `src/components/features/verification/VerificationPage.tsx` — multiple
- `src/components/features/verification/PhoneVerification.tsx` — multiple
- `src/app/(main)/securite/page.tsx` — multiple
- `src/app/(main)/contact/page.tsx` — Mail, MessageCircle, MapPin

**Lucide → Phosphor mapping:**

| Lucide                         | Phosphor                                     |
| ------------------------------ | -------------------------------------------- |
| `X`                            | `X`                                          |
| `Check`                        | `Check`                                      |
| `ChevronRight`                 | `CaretRight`                                 |
| `Circle`                       | `Circle`                                     |
| `Mail`                         | `Envelope`                                   |
| `Lock`                         | `Lock`                                       |
| `Eye`                          | `Eye`                                        |
| `EyeOff`                       | `EyeSlash`                                   |
| `AlertTriangle`                | `Warning`                                    |
| `User`                         | `User`                                       |
| `ArrowLeft`                    | `ArrowLeft`                                  |
| `CheckCircle` / `CheckCircle2` | `CheckCircle`                                |
| `RefreshCw`                    | `ArrowsClockwise`                            |
| `MessageCircle`                | `ChatCircle`                                 |
| `Search`                       | `MagnifyingGlass`                            |
| `Send`                         | `PaperPlaneRight`                            |
| `Plane`                        | `AirplaneTilt`                               |
| `MapPin`                       | `MapPin`                                     |
| `Calendar`                     | `CalendarBlank`                              |
| `Package`                      | `Package`                                    |
| `Plus`                         | `Plus`                                       |
| `Download`                     | `DownloadSimple`                             |
| `Star`                         | `Star`                                       |
| `Shield` / `ShieldCheck`       | `ShieldCheck`                                |
| `ArrowUpRight`                 | `ArrowUpRight`                               |
| `ArrowDownLeft`                | `ArrowDownLeft`                              |
| `Clock`                        | `Clock`                                      |
| `TrendingUp`                   | `TrendUp`                                    |
| `CreditCard`                   | `CreditCard`                                 |
| `UserCheck`                    | `UserCheck`                                  |
| `Info`                         | `Info`                                       |
| `Phone`                        | `Phone`                                      |
| `Loader2`                      | `SpinnerGap` (with className="animate-spin") |
| `AlertCircle`                  | `WarningCircle`                              |
| `ExternalLink`                 | `ArrowSquareOut`                             |

**For each file:**

1. Replace `import { ... } from 'lucide-react'` with `import { ... } from '@phosphor-icons/react'`
2. Replace icon names per mapping above
3. Replace Lucide sizing (`className="h-4 w-4"`) with Phosphor sizing (`size={16}`)
4. Add `weight="regular"` or appropriate weight

**Step N: Uninstall lucide-react**

Run: `pnpm remove lucide-react`

**Step N+1: Verify no Lucide imports remain**

Run: `grep -r "lucide-react" src/`
Expected: No results

**Step N+2: Commit**

```bash
git add -A
git commit -m "refactor(icons): migrate all Lucide icons to Phosphor, remove lucide-react"
```

---

## Task 4: Rebuild Button Component

**Files:**

- Modify: `src/components/ui/Button.tsx`

**Rewrite the component with:**

- 4 variants: `primary` (gradient accent), `secondary` (surface bg), `ghost` (transparent), `danger` (error)
- 3 sizes: `sm` (36px h), `md` (44px h), `lg` (52px h) — all touch-friendly
- States: loading (white SpinnerGap from Phosphor, animate-spin), disabled (opacity 0.4, pointer-events-none)
- Border-radius: `rounded-xl` (12px)
- Transitions: `transition-all duration-150`
- Hover: slight brighten + scale(1.02)
- Active/press: scale(0.98)
- Primary gradient: `bg-gradient-to-r from-primary-500 to-primary-600` with `hover:shadow-glow-primary`
- Secondary: `bg-surface-700 text-neutral-100 border border-white/[0.08] hover:bg-surface-600`
- Ghost: `text-surface-100 hover:bg-surface-700 hover:text-neutral-100`
- Full-width option: `fullWidth` prop → `w-full`

**Commit:**

```bash
git add src/components/ui/Button.tsx
git commit -m "style(ui): rebuild Button — dark variants, gradient primary, touch-friendly sizes"
```

---

## Task 5: Rebuild Card Component

**Files:**

- Modify: `src/components/ui/Card.tsx`

**Rewrite with:**

- 3 variants: `default` (bg-surface-800, border white/8%), `elevated` (+ shadow-sm, hover shadow-md + translateY(-2px)), `interactive` (elevated + cursor-pointer + scale(1.01) hover)
- Padding: `compact` (16px), `default` (20px mobile / 24px desktop), `spacious` (24px mobile / 32px desktop)
- Border-radius: `rounded-2xl` (16px)
- Keep subcomponents: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Update StatsCard: dark bg, white text, colored icon backgrounds at 10% opacity
- All text colors: `text-neutral-100` primary, `text-surface-100` secondary

**Commit:**

```bash
git add src/components/ui/Card.tsx
git commit -m "style(ui): rebuild Card — dark surfaces, elevation system, 3 variants"
```

---

## Task 6: Rebuild Input Component

**Files:**

- Modify: `src/components/ui/Input.tsx`

**Rewrite with:**

- Background: `bg-surface-700`
- Border: `border border-white/[0.08]`
- Border-radius: `rounded-xl`
- Height: `h-12` (48px) — touch-friendly
- Text: `text-neutral-100`, placeholder `text-surface-200`
- Focus: `border-primary-500 ring-2 ring-primary-500/20`
- Error: `border-error ring-2 ring-error/20` + WarningCircle icon inline + error message animated (slide-down with Framer Motion)
- Success: `border-success`
- Disabled: `opacity-40 cursor-not-allowed`
- Label: `text-sm font-medium text-surface-100 mb-2`

**Commit:**

```bash
git add src/components/ui/Input.tsx
git commit -m "style(ui): rebuild Input — dark surface, 48px height, animated error states"
```

---

## Task 7: Rebuild Modal & Sheet for Mobile

**Files:**

- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Sheet.tsx`

**Modal changes:**

- Backdrop: `bg-black/60 backdrop-blur-md`
- Content: `bg-surface-800 border border-white/[0.08] rounded-2xl`
- Animation: Framer Motion scale-in (0.95→1, opacity 0→1, spring)
- Mobile (<640px): full-screen from bottom (sheet behavior), with drag handle
- Close button: Phosphor X icon (already migrated in Task 3)

**Sheet changes:**

- Background: `bg-surface-800 border border-white/[0.08]`
- Drag handle: `w-10 h-1 rounded-full bg-surface-400 mx-auto mb-4` (bottom sheets)
- Spring animation: `damping: 30, stiffness: 400`
- Mobile bottom sheet: rounded top corners `rounded-t-3xl`, max-height `85vh`
- Swipe-to-dismiss: use Framer Motion drag gesture `drag="y"` with `dragConstraints`

**Commit:**

```bash
git add src/components/ui/Modal.tsx src/components/ui/Sheet.tsx
git commit -m "style(ui): rebuild Modal/Sheet — dark glass, full-screen mobile sheets, swipe dismiss"
```

---

## Task 8: Rebuild Badge, Tabs, Tooltip, DropdownMenu

**Files:**

- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Tabs.tsx`
- Modify: `src/components/ui/Tooltip.tsx`
- Modify: `src/components/ui/DropdownMenu.tsx`

**Badge:**

- Full rounded, compact
- Variants with semi-transparent colored backgrounds:
  - `success`: `bg-success/10 text-success`
  - `warning`: `bg-warning/10 text-warning`
  - `error`: `bg-error/10 text-error`
  - `info`: `bg-info/10 text-info`
  - `neutral`: `bg-white/10 text-surface-50`
  - `primary`: `bg-primary-500/10 text-primary-400`

**Tabs:**

- Dark bg: `bg-surface-800 rounded-xl p-1`
- Active tab: `bg-surface-600 text-neutral-100`
- Inactive: `text-surface-100 hover:text-neutral-200`
- Animated sliding indicator: Framer Motion `layoutId`
- Underline variant: `border-b border-white/[0.08]`, active underline `bg-primary-500` animated

**Tooltip:**

- `bg-surface-700 text-neutral-100 border border-white/[0.08] shadow-lg`
- `rounded-lg px-3 py-2 text-sm`

**DropdownMenu:**

- `bg-surface-800 border border-white/[0.08] rounded-xl shadow-lg`
- Items: `hover:bg-surface-700 text-neutral-100 rounded-lg`
- Separator: `border-white/[0.06]`

**Commit:**

```bash
git add src/components/ui/Badge.tsx src/components/ui/Tabs.tsx src/components/ui/Tooltip.tsx src/components/ui/DropdownMenu.tsx
git commit -m "style(ui): rebuild Badge, Tabs, Tooltip, DropdownMenu — dark theme, animated tabs"
```

---

## Task 9: Rebuild Layout — Header

**Files:**

- Modify: `src/components/layout/Header.tsx`

**Changes:**

- Background: `bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.06]` (glassmorphism sticky header)
- Logo: gradient text or accent-colored "A" mark
- Nav links: `text-surface-100 hover:text-neutral-100 transition-colors`
- Active nav: `text-neutral-100` with subtle underline
- Mobile menu: full-screen overlay `bg-surface-950/95 backdrop-blur-xl`, slide-down animation
- Notification bell: with dot indicator `bg-error` for unread
- User avatar: `ring-2 ring-primary-500/30`
- Demo banner: `bg-warning/10 text-warning border border-warning/20`

**Commit:**

```bash
git add src/components/layout/Header.tsx
git commit -m "style(layout): rebuild Header — glassmorphism, dark theme, animated mobile menu"
```

---

## Task 10: Rebuild Layout — BottomNav

**Files:**

- Modify: `src/components/layout/BottomNav.tsx`

**Changes:**

- Background: `bg-surface-950/90 backdrop-blur-xl border-t border-white/[0.06]`
- Safe area: `safe-bottom` class for iPhone notch
- Active item: `text-primary-400` with `weight="fill"`, label visible
- Inactive item: `text-surface-200` with `weight="regular"`, NO label (icon only)
- Center action button: `bg-gradient-to-r from-primary-500 to-primary-600 rounded-full w-12 h-12 shadow-glow-primary`
- Transition: `transition-all duration-200`
- Remove hardcoded 7 items — keep 5 max (Home, Search, [Publish CTA], Messages, Profil)

**Commit:**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "style(layout): rebuild BottomNav — glassmorphism, 5 items, gradient CTA, safe areas"
```

---

## Task 11: Update Main Layout & Auth Layout

**Files:**

- Modify: `src/app/(main)/layout.tsx`
- Modify: `src/app/(auth)/layout.tsx`

**Main layout:**

- Background: `bg-surface-950` (dark)
- Padding bottom: `pb-24` on mobile for BottomNav clearance (was pb-20, needs more)
- Remove `bg-neutral-50` (was light bg)

**Auth layout:**

- Background: `bg-surface-950` with subtle radial gradient
- Remove light gradient (`from-primary-50 to-secondary-50 via-white`)
- Add: `bg-[radial-gradient(ellipse_at_top,rgba(108,92,231,0.15),transparent_50%)]`
- Card area: centered, glassmorphism

**Commit:**

```bash
git add src/app/(main)/layout.tsx src/app/(auth)/layout.tsx
git commit -m "style(layout): dark backgrounds on main and auth layouts, fix mobile padding"
```

---

## Task 12: Rebuild Landing — HeroSection

**Files:**

- Modify: `src/components/features/home/HeroSection.tsx`

**Changes:**

- Keep dark bg `bg-surface-950` base
- Add animated gradient mesh background (CSS radial gradients with animation)
- Badge: `glass` style with pulsing green dot and live counter
- Heading: `text-display` utility class, gradient text `from-neutral-100 via-primary-300 to-accent-400`
- Subheading: `text-surface-100 text-lg max-w-2xl`
- Single primary CTA centered (not two buttons) — gradient primary, large
- Trust signals: row of small badges with Phosphor icons
- Scroll indicator: animated chevron down
- Stagger animations: Framer Motion `StaggerContainer` + `StaggerItem`
- Min height: `min-h-dvh` (dynamic viewport height, better for mobile)

**Commit:**

```bash
git add src/components/features/home/HeroSection.tsx
git commit -m "style(landing): rebuild Hero — gradient mesh, single CTA, Framer Motion stagger"
```

---

## Task 13: Rebuild Landing — FeaturesSection (Bento Grid)

**Files:**

- Modify: `src/components/features/home/FeaturesSection.tsx`

**Changes:**

- Dark background: `bg-surface-950`
- Section header: `text-h2`, `text-surface-100` description
- Bento grid: `glass` cards with `hover:border-primary-500/30 transition-all duration-300`
- Main card (escrow): `lg:col-span-2 lg:row-span-2` with gradient accent border
- Each card: Phosphor icon with `bg-primary-500/10 rounded-xl p-3` container, animated on hover
- Scroll reveal: Framer Motion `useInView` + stagger
- Remove light backgrounds (`bg-neutral-50`, `bg-white`)

**Commit:**

```bash
git add src/components/features/home/FeaturesSection.tsx
git commit -m "style(landing): rebuild Features — dark bento grid, glass cards, scroll reveal"
```

---

## Task 14: Rebuild Landing — HowItWorks

**Files:**

- Modify: `src/components/features/home/HowItWorks.tsx`

**Changes:**

- Reduce to 3 steps (was 4): Publiez → Réservez → Livrez
- Dark background: `bg-surface-900`
- Timeline: vertical on mobile (connected dots + line), horizontal on desktop
- Each step: numbered circle (gradient), title, description, mini-illustration
- Active step: `border-primary-500 bg-primary-500/10`
- Auto-rotate: keep 4s timer
- Preview card: `glass-strong` with window chrome (3 dots)
- Framer Motion: `AnimatePresence` for step transitions

**Commit:**

```bash
git add src/components/features/home/HowItWorks.tsx
git commit -m "style(landing): rebuild HowItWorks — 3 steps, dark timeline, animated previews"
```

---

## Task 15: Rebuild Landing — TestimonialsSection

**Files:**

- Modify: `src/components/features/home/TestimonialsSection.tsx`

**Changes:**

- Replace CSS columns masonry with **horizontal carousel** (swipeable)
- Use Framer Motion `drag="x"` with `dragConstraints` for swipe
- Dark background: `bg-surface-950`
- Cards: `glass` style, quote with `Quotes` Phosphor icon accent
- Stars: `text-warning` filled stars
- Auto-scroll: gentle, pauses on hover/touch
- Scroll indicators: dots at bottom showing current position
- Mobile: full-width cards, swipe between them

**Commit:**

```bash
git add src/components/features/home/TestimonialsSection.tsx
git commit -m "style(landing): rebuild Testimonials — swipeable carousel, glass cards, dark"
```

---

## Task 16: Rebuild Landing — CorridorsSection

**Files:**

- Modify: `src/components/features/home/CorridorsSection.tsx`

**Changes:**

- Dark background: `bg-surface-900` (slightly different from parent for depth)
- Corridor cards: `glass` with flag emojis, airplane icon, price/kg in `font-mono text-primary-400`
- Hover: `border-primary-500/30` + glow
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Stats row below cards: `text-surface-100` with Phosphor icons
- Scroll reveal stagger

**Commit:**

```bash
git add src/components/features/home/CorridorsSection.tsx
git commit -m "style(landing): rebuild Corridors — glass cards, mono prices, flag emojis"
```

---

## Task 17: Rebuild Landing — FinalCTA + AnimatedStats + LiveTicker

**Files:**

- Modify: `src/components/features/home/FinalCTA.tsx`
- Modify: `src/components/features/home/AnimatedStats.tsx`
- Modify: `src/components/features/home/LiveTicker.tsx`

**FinalCTA:**

- Full-width dark gradient section with radial accent glow
- Gradient text heading
- Single CTA button (gradient primary, large)
- Social proof: overlapping avatars + `AnimatedCounter` "+2000"
- Trust row: 3 items with Phosphor icons

**AnimatedStats:**

- Dark background
- Stats in `font-mono text-3xl font-bold text-neutral-100`
- `AnimatedCounter` with `text-primary-400` accent on symbols
- Compact grid `grid-cols-2 lg:grid-cols-4`

**LiveTicker:**

- `bg-surface-800 border-y border-white/[0.06]`
- Marquee items: flag emojis + corridor + price
- Pause on hover

**Commit:**

```bash
git add src/components/features/home/FinalCTA.tsx src/components/features/home/AnimatedStats.tsx src/components/features/home/LiveTicker.tsx
git commit -m "style(landing): rebuild FinalCTA, AnimatedStats, LiveTicker — dark, animated"
```

---

## Task 18: Rebuild Landing Page Composition + Footer

**Files:**

- Modify: `src/app/page.tsx` (if section order changes)
- Modify: `src/components/layout/Footer.tsx`

**Footer:**

- Dark: `bg-surface-900 border-t border-white/[0.06]`
- Logo + tagline
- Link columns: `text-surface-100 hover:text-neutral-100`
- Social icons: Phosphor `GithubLogo`, `TwitterLogo`, `LinkedinLogo`
- Copyright: `text-surface-200 text-sm`
- Grid: `grid-cols-2 md:grid-cols-4`

**Commit:**

```bash
git add src/app/page.tsx src/components/layout/Footer.tsx
git commit -m "style(layout): rebuild Footer — dark, social icons, responsive grid"
```

---

## Task 19: Rebuild Dashboard Page

**Files:**

- Modify: `src/components/features/dashboard/DashboardPage.tsx`

**Complete rewrite — Revolut-style layout:**

1. **Welcome header**: avatar (large, `ring-2 ring-primary-500/30`) + "Bonjour, Prénom" + `text-surface-100` date
2. **Balance card**: `glass-strong rounded-3xl p-6` — large number center (`font-mono text-4xl`), +/- trend, mini sparkline (CSS gradient or simple SVG)
3. **Quick actions row**: 4 circular buttons (`bg-surface-700 rounded-full w-14 h-14`) — icons: `Plus` (new listing), `Package` (send), `ChatCircle` (messages), `Clock` (history)
4. **Active shipments**: horizontal scroll section, each card `glass rounded-2xl` with stepper (3 dots: sent → transit → delivered), flag emojis, price
5. **Recent activity**: compact timeline, each item `border-l-2 border-surface-600 pl-4` with colored dot and time
6. **Verification banner** (if unverified): `bg-warning/10 border border-warning/20 rounded-xl`
7. **All wrapped in** `FadeIn` / `StaggerContainer` for entrance animations
8. **Mobile stats grid**: `grid-cols-2 gap-3` (not 4 — was cramped)

**Commit:**

```bash
git add src/components/features/dashboard/DashboardPage.tsx
git commit -m "style(dashboard): rebuild Revolut-style — balance card, quick actions, shipment cards"
```

---

## Task 20: Rebuild Listings Pages

**Files:**

- Modify: `src/components/features/listings/ListingsPage.tsx`
- Modify: `src/components/features/listings/DemandesPage.tsx`
- Modify: `src/components/features/listings/CorridorsPage.tsx`
- Modify: `src/components/features/listings/ListingDetail.tsx`
- Modify: `src/components/features/listings/NewListingForm.tsx`

**ListingsPage:**

- Dark bg, `UnderlineTabs` for "Toutes" / "Mes annonces"
- Search: `bg-surface-700` input with MagnifyingGlass icon
- Filter button → opens `Sheet` (bottom sheet on mobile)
- Cards: `glass rounded-2xl` with flag emojis, price/kg bold `font-mono`, avatar, status badge
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Empty state: centered illustration + CTA

**DemandesPage:**

- Same dark treatment
- Request cards with status stepper

**CorridorsPage:**

- Dark, corridor cards with route info and active listings count

**ListingDetail:**

- Dark, full-width header with corridor info
- Price in `font-mono text-3xl text-primary-400`
- Action buttons: primary CTA "Réserver" + secondary "Contacter"

**NewListingForm:**

- Dark inputs (all `bg-surface-700`)
- Step indicator if multi-step
- Date picker, weight slider

**Commit:**

```bash
git add src/components/features/listings/
git commit -m "style(listings): rebuild all listing pages — dark cards, bottom sheet filters, mono prices"
```

---

## Task 21: Rebuild Auth Pages

**Files:**

- Modify: `src/components/features/auth/LoginForm.tsx`
- Modify: `src/components/features/auth/RegisterForm.tsx`
- Modify: `src/components/features/auth/ResetPassword.tsx`
- Modify: `src/components/features/auth/VerifyEmail.tsx`

**All auth forms:**

- Card: `glass-strong rounded-3xl p-8 sm:p-10`
- Inputs: dark `bg-surface-700`, 48px height, Phosphor icons (already migrated in Task 3)
- CTA: full-width gradient primary button
- Links: `text-primary-400 hover:text-primary-300`
- Demo mode banner: `bg-warning/10 border-warning/20`
- Error messages: `bg-error/10 text-error rounded-xl p-3`
- Social login buttons: `glass` style with Google/Apple logos
- Transitions between forms: Framer Motion page-level slide

**Commit:**

```bash
git add src/components/features/auth/
git commit -m "style(auth): rebuild all auth forms — glassmorphism cards, dark inputs, gradient CTAs"
```

---

## Task 22: Rebuild Messages Page

**Files:**

- Modify: `src/components/features/chat/MessagesPage.tsx`

**Changes:**

- Dark background
- Conversation list: `bg-surface-800` cards, active `bg-surface-700 border-l-2 border-primary-500`
- Message bubbles: sent `bg-primary-600 text-white rounded-2xl rounded-br-md`, received `bg-surface-700 text-neutral-100 rounded-2xl rounded-bl-md`
- Timestamps: `text-surface-200 text-xs`
- Input bar: `bg-surface-800 border-t border-white/[0.06]` with `bg-surface-700` input + send button
- Mobile: full-screen conversation view, back arrow to list
- Typing indicator: 3 animated dots (`animate-pulse-dot` with staggered delays)
- Framer Motion `AnimatedList` for new messages

**Commit:**

```bash
git add src/components/features/chat/MessagesPage.tsx
git commit -m "style(messages): rebuild chat — dark bubbles, mobile full-screen, typing indicator"
```

---

## Task 23: Activate Framer Motion Animations Globally

**Files:**

- Modify: Multiple page files that lack animations

**Ensure every page uses:**

- `PageTransition` wrapper from `@/components/ui/Motion`
- `FadeIn` with staggered delays for sections
- `useInView` for scroll-triggered reveals on landing sections
- `AnimatedCounter` for all statistics
- `StaggerContainer` + `StaggerItem` for card grids and lists

**Key pages to add animations to:**

- `src/components/features/listings/ListingsPage.tsx` — stagger grid cards
- `src/components/features/listings/CorridorsPage.tsx` — stagger cards
- `src/components/features/chat/MessagesPage.tsx` — animated list
- All landing sections (verify they use scroll reveals)

**Commit:**

```bash
git add -A
git commit -m "style(animations): activate Framer Motion across all pages — stagger, scroll reveal"
```

---

## Task 24: Final Polish & Verification

**Files:**

- All modified files

**Step 1: Build check**

Run: `pnpm build`
Expected: Build passes with zero errors

**Step 2: Verify no Lucide imports remain**

Run: `grep -r "lucide-react" src/`
Expected: No matches

**Step 3: Verify no light-mode remnants**

Run: `grep -r "bg-white\b" src/components/ src/app/`
Expected: Only inside conditional/hover states, not as page backgrounds

Run: `grep -r "bg-neutral-50" src/components/ src/app/`
Expected: No matches as page backgrounds

**Step 4: Mobile audit checklist**

- [ ] All touch targets ≥ 44px
- [ ] BottomNav has safe-area-inset-bottom
- [ ] Content doesn't hide behind BottomNav (pb-24)
- [ ] Modals are full-screen sheets on mobile
- [ ] No horizontal overflow on 375px viewport
- [ ] Text is readable (min 14px body, 12px captions)

**Step 5: Final commit**

```bash
git add -A
git commit -m "style(polish): final verification — build clean, no Lucide, mobile audit pass"
```

---

## Execution Order & Dependencies

```
Task 1 (tokens) → Task 2 (fonts) → Task 3 (icons)
    ↓
Tasks 4-8 (UI components) — can run in parallel
    ↓
Tasks 9-11 (layouts) — can run in parallel
    ↓
Tasks 12-18 (landing pages) — sequential, top to bottom
    ↓
Tasks 19-22 (app pages) — can run in parallel
    ↓
Task 23 (animations) → Task 24 (verification)
```

**Total: 24 tasks, ~50 files modified**
