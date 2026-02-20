# Aesthetic Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Total aesthetic overhaul of Akiri SaaS — from "generic template" to "premium Stripe/Linear" feel with indigo/violet palette, Phosphor Icons duotone, hybrid dark landing + light app.

**Architecture:** Replace design tokens in globals.css, rewrite all 6 core UI components, migrate all Lucide icons to Phosphor, redesign all 3 layout components and all feature pages. No business logic changes.

**Tech Stack:** Next.js 16, Tailwind CSS v4, @phosphor-icons/react (new), Inter font (kept)

**Design Reference:** See `docs/plans/2026-02-20-aesthetic-overhaul-design.md` for full design spec.

---

### Task 1: Install Phosphor Icons dependency

**Files:**

- Modify: `package.json`

**Step 1: Install @phosphor-icons/react**

Run: `pnpm add @phosphor-icons/react`

**Step 2: Verify install**

Run: `pnpm list @phosphor-icons/react`
Expected: Shows version installed

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @phosphor-icons/react for icon migration"
```

---

### Task 2: Rewrite design tokens — globals.css

**Files:**

- Modify: `src/app/globals.css` (295 lines → full rewrite)

**Step 1: Replace entire @theme block**

Replace the color palette from orange/green/amber to indigo/violet/zinc:

```css
@import 'tailwindcss';

@theme {
  /* Akiri Premium Palette — Indigo/Violet */
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;

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

  /* Neutral — Zinc scale (replaces warm gray) */
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
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #f43f5e;
  --color-info: #3b82f6;

  /* Font */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Radius — unified at lg */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;

  /* Shadows — subtler */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-soft: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card: 0 0 0 1px rgb(0 0 0 / 0.03), 0 1px 2px 0 rgb(0 0 0 / 0.06);
}
```

**Step 2: Update base layer**

```css
@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    @apply bg-neutral-50 text-neutral-900 antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
    letter-spacing: -0.011em;
  }

  *:focus-visible {
    @apply outline-primary-500 outline-2 outline-offset-2;
  }
}
```

**Step 3: Simplify animations — remove glow (orange-specific), update colors in remaining**

Keep only essential animations: `slide-in-up`, `fade-in`, `pulse-live`, `pulse-dot`, `shimmer`, `marquee`, `gradient-x`, `bounce-subtle`. Remove: `float`, `float-slow`, `count-pulse`, `scale-in`, `glow`, `reveal-up`, `slide-in-right`.

Update glow keyframe to use indigo:

```css
@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
  }
  50% {
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
  }
}
```

**Step 4: Verify build**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors (some animations used in components may warn — that's fine, we fix those in subsequent tasks)

**Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "style: replace design tokens — indigo/zinc palette, subtler shadows"
```

---

### Task 3: Rewrite Button component

**Files:**

- Modify: `src/components/ui/Button.tsx` (84 lines)

**Step 1: Rewrite variant and size styles**

Replace `variantStyles`:

```typescript
const variantStyles: Record<string, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300',
  outline:
    'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100',
  ghost: 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
  danger: 'bg-error text-white hover:bg-rose-600 active:bg-rose-700',
};
```

Replace `sizeStyles`:

```typescript
const sizeStyles: Record<string, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-10 px-5 text-sm rounded-lg gap-2',
};
```

Remove `shadow-sm` from all variants (no idle shadows on buttons).

**Step 2: Verify build**

Run: `pnpm typecheck`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "style(ui): redesign Button — indigo primary, no idle shadows, compact sizes"
```

---

### Task 4: Rewrite Card component

**Files:**

- Modify: `src/components/ui/Card.tsx` (203 lines)

**Step 1: Rewrite variant styles**

Replace `variantStyles`:

```typescript
const variantStyles: Record<string, string> = {
  default: 'bg-white border border-neutral-200/60 rounded-lg shadow-xs',
  bordered: 'bg-white border border-neutral-200 rounded-lg',
  elevated: 'bg-white border border-neutral-200/60 rounded-lg shadow-soft',
  interactive: 'bg-white border border-neutral-200/60 rounded-lg shadow-xs cursor-pointer',
  gradient: 'bg-white border border-neutral-200/60 rounded-lg shadow-xs',
  glass: 'bg-white/80 backdrop-blur-lg border border-neutral-200/40 rounded-lg shadow-sm',
};
```

**Step 2: Update hover behavior**

Replace hover logic — no more `translate-y`:

```typescript
hover && 'transition-all duration-200 hover:shadow-soft hover:border-neutral-300',
variant === 'interactive' && 'transition-all duration-200 hover:shadow-soft hover:border-neutral-300 active:scale-[0.99]',
```

**Step 3: Update CardTitle and CardDescription to use zinc-based colors**

- CardTitle: `text-lg font-semibold text-neutral-900` (keep as-is, neutral is now zinc)
- CardDescription: `text-sm text-neutral-500` (keep as-is)

**Step 4: Update StatsCard — remove hover translate, simplify**

The `StatsCard` variants should reference `primary` (now indigo) instead of orange:

```typescript
const statsVariantStyles: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
  default: { bg: 'bg-white', iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' },
  primary: { bg: 'bg-white', iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
  secondary: { bg: 'bg-white', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  accent: { bg: 'bg-white', iconBg: 'bg-accent-50', iconColor: 'text-accent-600' },
};
```

Remove `group-hover:scale-110` from the icon container — too flashy.

**Step 5: Verify & commit**

Run: `pnpm typecheck`

```bash
git add src/components/ui/Card.tsx
git commit -m "style(ui): redesign Card — rounded-lg, subtle borders, no hover translate"
```

---

### Task 5: Rewrite Badge component

**Files:**

- Modify: `src/components/ui/Badge.tsx` (43 lines)

**Step 1: Rewrite variants with ring style**

```typescript
const variantStyles: Record<string, string> = {
  default: 'bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200/60',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  error: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  outline: 'bg-transparent text-neutral-600 ring-1 ring-neutral-200',
};
```

**Step 2: Update base class — rounded-md instead of rounded-full**

```typescript
className={cn(
  'inline-flex items-center rounded-md font-medium',
  ...
)}
```

**Step 3: Verify & commit**

```bash
git add src/components/ui/Badge.tsx
git commit -m "style(ui): redesign Badge — ring borders, rounded-md, softer colors"
```

---

### Task 6: Rewrite Input component

**Files:**

- Modify: `src/components/ui/Input.tsx` (60 lines)

**Step 1: Update input styles**

Replace the input className:

```typescript
cn(
  'flex h-9 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900',
  'placeholder:text-neutral-400',
  'transition-colors duration-150',
  'focus:border-primary-500 focus:ring-primary-500/20 focus:ring-2 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-50',
  error ? 'border-error focus:border-error focus:ring-error/20' : 'border-neutral-300',
  leftIcon && 'pl-10',
  rightIcon && 'pr-10',
  className
);
```

Main change: `h-10` → `h-9` (more compact).

**Step 2: Verify & commit**

```bash
git add src/components/ui/Input.tsx
git commit -m "style(ui): redesign Input — h-9 compact, indigo focus ring"
```

---

### Task 7: Rewrite Avatar component

**Files:**

- Modify: `src/components/ui/Avatar.tsx` (67 lines)

**Step 1: Update fallback colors**

Replace `bg-primary-100 text-primary-700` with `bg-primary-100 text-primary-700` (stays indigo since tokens changed).

**Step 2: Update verified badge**

Replace `bg-secondary-500` with `bg-emerald-500`:

```tsx
<div className="bg-emerald-500 absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white">
```

**Step 3: Verify & commit**

```bash
git add src/components/ui/Avatar.tsx
git commit -m "style(ui): update Avatar — emerald verified badge"
```

---

### Task 8: Rewrite Skeleton component

**Files:**

- Modify: `src/components/ui/Skeleton.tsx` (20 lines)

**Step 1: Update color**

Replace `bg-neutral-200` with `bg-neutral-100`:

```tsx
'animate-pulse bg-neutral-100',
```

**Step 2: Verify & commit**

```bash
git add src/components/ui/Skeleton.tsx
git commit -m "style(ui): softer Skeleton — bg-neutral-100"
```

---

### Task 9: Rewrite Header — premium nav with Phosphor icons

**Files:**

- Modify: `src/components/layout/Header.tsx` (208 lines)

**Step 1: Replace Lucide imports with Phosphor**

```typescript
import {
  List,
  X,
  MagnifyingGlass,
  Bell,
  ChatCircle,
  SignOut,
  TestTube,
} from '@phosphor-icons/react';
```

Remove `import { Menu, X, Search, Bell, MessageCircle, LogOut, TestTube2 } from 'lucide-react';`

**Step 2: Update all icon references in JSX**

- `<Menu ...>` → `<List weight="duotone" size={24} />`
- `<X ...>` → `<X weight="bold" size={24} />`
- `<Search ...>` → `<MagnifyingGlass weight="duotone" size={20} />`
- `<Bell ...>` → `<Bell weight="duotone" size={20} />`
- `<MessageCircle ...>` → `<ChatCircle weight="duotone" size={20} />`
- `<LogOut ...>` → `<SignOut weight="duotone" size={20} />`
- `<TestTube2 ...>` → `<TestTube weight="duotone" size={16} />`

**Step 3: Update logo**

Replace `bg-primary-500` with `bg-primary-600` for the logo square.

**Step 4: Update Link/Button patterns**

Replace `<Link href="/login"><Button>` with styled `<Link>`:

```tsx
<Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
  Connexion
</Link>
<Link href="/register" className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">
  Publier une annonce
</Link>
```

**Step 5: Verify & commit**

Run: `pnpm typecheck && pnpm lint`

```bash
git add src/components/layout/Header.tsx
git commit -m "style(layout): redesign Header — Phosphor icons, cleaner nav"
```

---

### Task 10: Rewrite BottomNav — Phosphor icons

**Files:**

- Modify: `src/components/layout/BottomNav.tsx` (71 lines)

**Step 1: Replace Lucide imports**

```typescript
import {
  House,
  MagnifyingGlass,
  PlusCircle,
  GlobeHemisphereWest,
  Package,
  ChatCircle,
  User,
} from '@phosphor-icons/react';
```

**Step 2: Update navItems icon references**

Map each Lucide icon to its Phosphor equivalent in the array:

- `Home` → `House`
- `Search` → `MagnifyingGlass`
- `PlusCircle` → `PlusCircle`
- `Globe` → `GlobeHemisphereWest`
- `Package` → `Package`
- `MessageCircle` → `ChatCircle`
- `User` → `User`

**Step 3: Update icon JSX rendering**

Replace `<Icon className="h-5 w-5" />` with `<Icon weight={isActive ? 'fill' : 'duotone'} size={20} />`.

Update the action button icon: `<Icon weight="bold" size={18} />`

**Step 4: Update action button color**

Replace `bg-primary-500` with `bg-primary-600`.

**Step 5: Verify & commit**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "style(layout): redesign BottomNav — Phosphor icons, fill on active"
```

---

### Task 11: Rewrite Footer — cleaner, Phosphor

**Files:**

- Modify: `src/components/layout/Footer.tsx` (103 lines)

**Step 1: Update logo color**

Replace `bg-primary-500` with `bg-primary-600`.

**Step 2: Update link hover colors**

Replace all `hover:text-primary-600` with `hover:text-neutral-900` for a more subtle hover effect.

**Step 3: Update divider**

Keep `border-neutral-200` — it maps to zinc-200 now automatically.

**Step 4: Verify & commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "style(layout): update Footer — indigo logo, subtle hovers"
```

---

### Task 12: Rewrite HeroSection — dark premium hero

**Files:**

- Modify: `src/components/features/home/HeroSection.tsx` (155 lines → full rewrite)

**Step 1: Replace Lucide imports with Phosphor**

```typescript
import {
  ArrowRight,
  ShieldCheck,
  GlobeHemisphereWest,
  Package,
  CheckCircle,
  Lightning,
  ArrowDown,
} from '@phosphor-icons/react';
```

**Step 2: Rewrite hero section**

Key changes:

- Background: `bg-neutral-950` with indigo gradient mesh
- Title: `text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white`
- Gradient text: `from-primary-400 via-accent-400 to-primary-400`
- CTAs: primary indigo `<Link>` + ghost `<Link>` with `border-white/10`
- Reduce all animation delays (max 200ms)
- Trust signals: Phosphor duotone icons in `bg-white/5` circles
- Remove background blob animations (too busy) — replace with single subtle radial gradient

**Step 3: Remove unused Button import**

Ensure no `<Button>` used — only styled `<Link>` elements.

**Step 4: Verify & commit**

```bash
git add src/components/features/home/HeroSection.tsx
git commit -m "style(landing): redesign HeroSection — dark premium with indigo gradients"
```

---

### Task 13: Rewrite LiveTicker — minimal dark ticker

**Files:**

- Modify: `src/components/features/home/LiveTicker.tsx` (61 lines)

**Step 1: Replace Lucide Badge import (if any) and update**

Use Phosphor for any icons. Update the live dot to emerald.

**Step 2: Update styling**

- Background: `bg-neutral-950 border-b border-white/5`
- Text: `text-neutral-400`, names in `text-white`
- Badge: `bg-white/5 text-neutral-400 ring-1 ring-white/10`
- Live label: `text-emerald-400`

**Step 3: Verify & commit**

```bash
git add src/components/features/home/LiveTicker.tsx
git commit -m "style(landing): redesign LiveTicker — dark theme, emerald live dot"
```

---

### Task 14: Rewrite AnimatedStats — clean stats bar

**Files:**

- Modify: `src/components/features/home/AnimatedStats.tsx` (107 lines)

**Step 1: Replace Lucide with Phosphor**

Map all icons to Phosphor duotone equivalents.

**Step 2: Update section styling**

- Background: `bg-neutral-950` (continues dark landing theme)
- Cards: `bg-white/5 border border-white/5 rounded-lg`
- Numbers: `text-white font-semibold`
- Labels: `text-neutral-400`
- Icons: Phosphor duotone `text-primary-400`

**Step 3: Verify & commit**

```bash
git add src/components/features/home/AnimatedStats.tsx
git commit -m "style(landing): redesign AnimatedStats — dark cards, indigo accents"
```

---

### Task 15: Rewrite HowItWorks — clean steps

**Files:**

- Modify: `src/components/features/home/HowItWorks.tsx` (168 lines)

**Step 1: Replace icons with Phosphor duotone**

**Step 2: Update section styling**

- Background: `bg-white` (transition from dark landing to light)
- Step numbers: `bg-primary-50 text-primary-600 font-semibold` circles
- Step titles: `text-neutral-900 font-semibold`
- Descriptions: `text-neutral-500`
- Connector lines: `border-neutral-200`

**Step 3: Verify & commit**

```bash
git add src/components/features/home/HowItWorks.tsx
git commit -m "style(landing): redesign HowItWorks — Phosphor icons, clean steps"
```

---

### Task 16: Rewrite FeaturesSection

**Files:**

- Modify: `src/components/features/home/FeaturesSection.tsx` (126 lines)

**Step 1: Replace icons with Phosphor duotone**

**Step 2: Update styling**

- Background: `bg-neutral-50`
- Feature cards: `bg-white border border-neutral-200/60 rounded-lg p-6`
- Icon containers: `bg-primary-50 rounded-lg h-10 w-10` with Phosphor duotone `text-primary-600`
- Hover: `hover:border-neutral-300 hover:shadow-soft transition-all duration-200`

**Step 3: Verify & commit**

```bash
git add src/components/features/home/FeaturesSection.tsx
git commit -m "style(landing): redesign FeaturesSection — clean cards, Phosphor icons"
```

---

### Task 17: Rewrite TestimonialsSection

**Files:**

- Modify: `src/components/features/home/TestimonialsSection.tsx` (144 lines)

**Step 1: Replace icons with Phosphor**

**Step 2: Update styling**

- Background: `bg-white`
- Testimonial cards: `bg-neutral-50 border border-neutral-200/60 rounded-lg p-6`
- Quote marks: `text-primary-200`
- Star ratings: `text-amber-400` (keep)
- Names: `text-neutral-900 font-semibold`
- Roles/routes: `text-neutral-500`

**Step 3: Verify & commit**

```bash
git add src/components/features/home/TestimonialsSection.tsx
git commit -m "style(landing): redesign TestimonialsSection — clean cards"
```

---

### Task 18: Rewrite CorridorsSection (landing)

**Files:**

- Modify: `src/components/features/home/CorridorsSection.tsx` (136 lines)

**Step 1: Replace icons with Phosphor**

**Step 2: Update styling**

- Background: `bg-neutral-50`
- Country pills: `bg-white border border-neutral-200/60 rounded-lg`
- Flag emojis: `shrink-0`
- Hover: `hover:border-primary-200 transition-colors`

**Step 3: Verify & commit**

```bash
git add src/components/features/home/CorridorsSection.tsx
git commit -m "style(landing): redesign CorridorsSection — clean country cards"
```

---

### Task 19: Rewrite FinalCTA

**Files:**

- Modify: `src/components/features/home/FinalCTA.tsx` (74 lines)

**Step 1: Replace icons with Phosphor**

**Step 2: Update styling**

- Background: `bg-neutral-950` (back to dark for final impact)
- Title: `text-white text-3xl sm:text-4xl font-semibold tracking-tight`
- Subtitle: `text-neutral-400`
- CTA button: styled `<Link>` with `bg-primary-500 hover:bg-primary-600 text-white rounded-lg`
- Subtle indigo glow behind CTA

**Step 3: Verify & commit**

```bash
git add src/components/features/home/FinalCTA.tsx
git commit -m "style(landing): redesign FinalCTA — dark section, indigo CTA"
```

---

### Task 20: Rewrite DashboardPage — clean light dashboard

**Files:**

- Modify: `src/components/features/dashboard/DashboardPage.tsx` (520 lines)

**Step 1: Replace all Lucide imports with Phosphor**

```typescript
import {
  Package,
  AirplaneTilt,
  ChatCircle,
  TrendUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  WarningCircle,
  Star,
  ShieldCheck,
  Sparkle,
  CaretRight,
} from '@phosphor-icons/react';
```

Remove all lucide-react imports.

**Step 2: Update stat cards**

- Remove `HoverScale`, `StaggerContainer`, `StaggerItem`, `FadeIn`, `SlideUp`, `AnimatedCounter`, `Shimmer` wrappers
- Use simple `transition-colors duration-150` instead
- Stat cards: `bg-white border border-neutral-200/60 rounded-lg shadow-xs`
- Icon containers: colored bg + Phosphor duotone
- Values: `text-2xl font-semibold text-neutral-900`
- Labels: `text-sm text-neutral-500`

**Step 3: Simplify quick actions**

- Remove `HoverScale` wrappers
- Cards: `rounded-lg border border-neutral-100 bg-white p-4 hover:bg-neutral-50 transition-colors`
- Icons: Phosphor duotone in colored squares
- Keep `min-w-0 flex-1` + `truncate` from previous fix

**Step 4: Simplify activity feed**

- Remove `FadeIn` wrappers
- Simple list with `divide-y divide-neutral-100`
- Icons: Phosphor duotone in colored circles

**Step 5: Update loading skeleton**

- Replace `Shimmer` with `Skeleton` (simpler)
- Use `rounded-lg` instead of `rounded-2xl`

**Step 6: Update verification banner**

- `bg-amber-50` border card (no gradient)
- Phosphor `WarningCircle` duotone

**Step 7: Verify & commit**

Run: `pnpm typecheck && pnpm lint`

```bash
git add src/components/features/dashboard/DashboardPage.tsx
git commit -m "style(app): redesign DashboardPage — clean light design, Phosphor icons"
```

---

### Task 21: Rewrite ListingsPage

**Files:**

- Modify: `src/components/features/listings/ListingsPage.tsx` (279 lines)

**Step 1: Replace Lucide with Phosphor**

```typescript
import {
  MagnifyingGlass,
  Sliders,
  MapPin,
  CalendarBlank,
  Package,
  Star,
  CaretDown,
} from '@phosphor-icons/react';
```

**Step 2: Update all icon references**

Replace all `className="h-X w-X"` patterns with `size={X}` and `weight="duotone"`.

**Step 3: Keep select fixes from previous commit**

The `appearance-none` + chevron CSS fixes stay as-is.

**Step 4: Update card styling**

- Listing cards: keep `hover:shadow-md`, add `hover:border-primary-200`
- Route text: `text-primary-600` (now indigo)
- Price: `text-primary-600 font-semibold`

**Step 5: Verify & commit**

```bash
git add src/components/features/listings/ListingsPage.tsx
git commit -m "style(app): redesign ListingsPage — Phosphor icons, indigo accents"
```

---

### Task 22: Rewrite CorridorsPage

**Files:**

- Modify: `src/components/features/listings/CorridorsPage.tsx` (591 lines)

**Step 1: Replace all Lucide imports with Phosphor**

```typescript
import {
  ArrowRight,
  GlobeHemisphereWest,
  TrendUp,
  TrendDown,
  Minus,
  AirplaneTilt,
  Package,
  UsersThree,
  CalendarBlank,
  Star,
  CheckCircle,
  Broadcast,
} from '@phosphor-icons/react';
```

**Step 2: Update all icon references throughout**

All icons: `weight="duotone"` + `size={N}`.

**Step 3: Update section styling**

- Live badge: `bg-rose-50 text-rose-600` (keep)
- Stat cards: same as dashboard — `bg-white border rounded-lg`
- Activity feed: Phosphor icons in colored circles
- Corridor cards: keep `shrink-0` on flags from previous fix
- CTA banner: `rounded-xl` (keep from previous fix), update gradient to `from-primary-500 to-primary-600`

**Step 4: Verify & commit**

Run: `pnpm typecheck && pnpm lint`

```bash
git add src/components/features/listings/CorridorsPage.tsx
git commit -m "style(app): redesign CorridorsPage — Phosphor icons, indigo theme"
```

---

### Task 23: Final build verification

**Step 1: Full typecheck**

Run: `pnpm typecheck`
Expected: 0 errors

**Step 2: Lint**

Run: `pnpm lint`
Expected: 0 errors

**Step 3: Production build**

Run: `pnpm build`
Expected: Build succeeds, all pages generate

**Step 4: Check for unused Lucide imports**

Run: `grep -r "from 'lucide-react'" src/` to find any remaining Lucide imports in modified files.

Note: lucide-react may still be used in files NOT part of this refonte (auth pages, chat, transactions, etc.). That's fine — we only migrate the files in scope.

**Step 5: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "style: final cleanup after aesthetic overhaul"
```
