/**
 * Shell Adaptatif Configuration
 *
 * Three modes driven by CSS breakpoints (no JS detection needed):
 *
 * MOBILE (<768px / md:)
 *   - Header: visible (sticky top)
 *   - BottomNav: visible (fixed bottom)
 *   - Sidebar: hidden
 *   - Content: pb-24 (BottomNav clearance)
 *
 * TABLET (768px–1024px / md: to lg:)
 *   - Header: visible (sticky top, ml-16)
 *   - BottomNav: hidden
 *   - Sidebar: collapsed (w-16, icons only, tooltip on hover)
 *   - Content: pl-16, pb-0
 *
 * DESKTOP (>1024px / lg:)
 *   - Header: visible (sticky top, ml-60)
 *   - BottomNav: hidden
 *   - Sidebar: expanded (w-60, icons + labels)
 *   - Content: pl-60, pb-0
 *
 * Implementation:
 *   - Sidebar: hidden md:flex w-16 lg:w-60 (+ transition-all duration-300)
 *   - BottomNav: md:hidden
 *   - Header: md:ml-16 lg:ml-60
 *   - Main: pb-24 md:pb-0 md:pl-16 lg:pl-60
 */

export const SHELL_BREAKPOINTS = {
  mobile: { max: 768 },
  tablet: { min: 768, max: 1024 },
  desktop: { min: 1024 },
} as const;

export const SIDEBAR_WIDTH = {
  collapsed: 64, // w-16 = 4rem = 64px
  expanded: 240, // w-60 = 15rem = 240px
} as const;

export const BOTTOM_NAV_HEIGHT = 64; // h-16 = 4rem = 64px
export const HEADER_HEIGHT = 64; // h-16 = 4rem = 64px
