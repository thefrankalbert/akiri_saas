# Akiri Premium Overhaul — Phase 1: UI Refonte

**Date**: 2026-02-21
**Approach**: Revolut Dark — full design system rebuild, mobile-first
**Scope**: Visual + UX overhaul of all existing pages (no new features in Phase 1)

---

## 1. Design System Foundations

### Color Palette (Dark-first)

| Token              | Usage                     | Value                           |
| ------------------ | ------------------------- | ------------------------------- |
| `--bg-primary`     | Main app background       | `#0A0A0F`                       |
| `--bg-secondary`   | Cards, surfaces           | `#12121A`                       |
| `--bg-tertiary`    | Inputs, recessed elements | `#1A1A25`                       |
| `--border`         | Subtle borders            | `rgba(255,255,255,0.08)`        |
| `--text-primary`   | Primary text              | `#F5F5F7`                       |
| `--text-secondary` | Secondary text            | `#8A8A9A`                       |
| `--accent`         | CTAs, links, active       | `#6C5CE7` to `#A78BFA` gradient |
| `--success`        | Confirmed, delivered      | `#00D09C`                       |
| `--warning`        | Pending states            | `#FFB800`                       |
| `--error`          | Errors, cancelled         | `#FF4757`                       |

### Typography (Inter, strict scale)

```
Display:  48/56/64px — weight 800 — landing hero only
H1:       36px mobile / 40px desktop — weight 700
H2:       28px mobile / 32px desktop — weight 700
H3:       22px mobile / 24px desktop — weight 600
Body:     16px — weight 400/500 — line-height 1.6
Caption:  13px — weight 500 — text-secondary
Mono:     14px — JetBrains Mono — numbers/prices
```

### Spacing Scale

`4px` micro | `8px` tight | `12px` compact | `16px` default | `24px` loose | `32px` section | `48px` between-sections | `64px` page-sections

### Elevation (Shadow System)

```
elevation-0: flat (inputs, inline)
elevation-1: 0 1px 3px rgba(0,0,0,0.3) — cards
elevation-2: 0 4px 12px rgba(0,0,0,0.4) — modals, dropdowns
elevation-3: 0 8px 24px rgba(0,0,0,0.5) — overlays
```

### Mobile Rules

- Touch targets: minimum 44x44px
- Bottom nav padding: `pb-24` on all main content
- Full-screen modals on mobile (<640px)
- Swipe-to-dismiss on sheets
- Safe area insets (iPhone notch)

---

## 2. UI Components — Rebuild

### Button (4 variants)

- **Primary**: gradient accent, white text, hover glow, press scale(0.98)
- **Secondary**: bg-tertiary, border, text-primary, hover lighten
- **Ghost**: transparent, text-secondary, hover bg-tertiary
- **Danger**: bg-error, white text
- All: 44px min height, 12px radius, 150ms transition, white animated spinner, disabled 0.5 opacity

### Card (3 levels)

- **Default**: bg-secondary, subtle border, 16px radius
- **Elevated**: + elevation-1, hover elevation-2 + translateY(-2px)
- **Interactive**: elevated + pointer + scale(1.01) hover + tap feedback
- All: 20px padding mobile / 24px desktop

### Input

- bg-tertiary, border, 12px radius, 48px height
- Focus: accent border, accent/20% glow ring
- Error: error border, error/20% glow, inline alert icon, animated error message
- Success: success border

### Modal / Sheet

- Desktop (>640px): centered modal, backdrop blur 8px, scale-in animation
- Mobile (<640px): full-screen sheet from bottom, drag handle, swipe-to-dismiss, spring animation

### Badge

- Compact, full radius, semi-transparent status color background
- Variants: success, warning, error, info, neutral (all at 10% opacity)

### Tabs

- Revolut-style: animated sliding underline (Framer Motion layoutId)
- 44px height touch targets, swipeable on mobile

### Toast (Sonner)

- bottom-center mobile, bottom-right desktop
- Dark style with status icon, 4s auto-dismiss, swipe-to-dismiss mobile

---

## 3. Pages — Structure & UX

### Landing Page

- **Hero**: dark, gradient text violet, single centered CTA, animated gradient mesh bg, live badge with animated counter
- **Social proof**: horizontal trust badges bar, infinite scroll
- **Features**: dark bento grid, animated Phosphor icons on hover, gradient accent on main card
- **How it works**: 3 steps (not 4), vertical timeline mobile / horizontal desktop, animated micro-illustrations
- **Testimonials**: horizontal swipeable carousel, card with photo + stars + quote, auto-scroll pausable
- **Corridors**: compact grid with flags, "starting at X EUR/kg" pricing
- **Final CTA**: gradient full-width, animated "+2000 users" counter, single button

### Dashboard (Revolut-style)

- **Header card**: greeting + avatar, dark gradient background
- **Balance card**: large centered number (total earnings), +/- variation, sparkline graph
- **Quick actions**: 4 circular icon buttons (New listing, Send parcel, Messages, History)
- **Active shipments**: horizontal swipeable cards with visual stepper (sent → in transit → delivered)
- **Recent activity**: compact timeline with status icons
- All content stacked vertically on mobile

### Listings

- **Tabs**: "All" / "My listings" / "My requests" with animated underline
- **Listing cards**: corridor photo (flags from/to), price/kg bold, date, status badge, traveler avatar
- **Filters**: bottom sheet on mobile, multi-select chips
- **Empty state**: illustration + CTA

### Auth Pages

- Full-screen dark, centered logo, glassmorphism card form
- Large inputs (48px), generous spacing
- Full-width gradient CTA
- Social login: outline buttons with Google/Apple logos
- Slide transitions between login/register/reset

### Messages

- iMessage/WhatsApp style: rounded bubbles, discreet timestamps, small avatars
- Mobile: full-screen conversation, back arrow to list
- Typing indicator: 3 animated dots
- Bottom sticky input with auto-expand height

---

## 4. Animations & Micro-interactions

### Page Transitions (Framer Motion)

- Route enter: fadeIn + slideUp (20px, 300ms, ease-out)
- Route back: slideRight for navigation sense

### Scroll Animations

- Landing sections: reveal-up on scroll (IntersectionObserver + Framer useInView)
- Card grids: stagger appear (50ms delay between each)

### Micro-interactions

- Buttons: scale(0.98) press, scale(1.02) hover, 150ms spring
- Cards: translateY(-2px) + shadow increase on hover
- Tabs: animated layoutId underline
- Toggle/Switch: spring animation on thumb
- Like/Save: bounce + pulse on activate
- Numbers: AnimatedCounter for all stats
- Loading: skeleton shimmer with animated gradient

### Navigation

- BottomNav: active icon fill + label, inactive outline no label, 200ms transition
- Pull-to-refresh on list pages
- Haptic feedback via navigator.vibrate() on key actions

### Cleanup

- Remove Lucide React entirely
- Phosphor Icons only: regular (default), fill (active), bold (emphasis)

---

## 5. Technical Decisions

- **Keep**: Next.js 16, Tailwind v4, Framer Motion, Radix UI, Phosphor Icons, Sonner
- **Remove**: Lucide React
- **Add**: JetBrains Mono font (for prices/numbers)
- **No new libraries needed** — everything is already in the stack

## 6. Out of Scope (Phase 2)

- New feature pages (Settings, Activity, Reviews, Transactions)
- Real API integration (keep mock data)
- Backend changes
- Payment flows
- Notification system
