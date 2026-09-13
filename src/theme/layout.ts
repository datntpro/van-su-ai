/**
 * Responsive layout tokens for bar phones (~320px) and foldables
 * (Galaxy Fold cover ~280–320, unfolded ~700–900+).
 *
 * Prefer flex + % over fixed pixel widths so hinge / resize does not clip.
 */

export const BREAKPOINTS = {
  /** Cover / very narrow phone */
  narrow: 360,
  /** Phone / Fold closed or typical bar */
  phone: 480,
  /** Unfolded Fold / large phone / small tablet — use max column + optional 2-col */
  wide: 700,
} as const;

/** Centered reading column on unfolded / large screens */
export const CONTENT_MAX_WIDTH = 560;

/** Slightly wider for chat bubbles area on large screens */
export const CONTENT_MAX_WIDTH_WIDE = 640;

export const GUTTER = {
  narrow: 12,
  default: 16,
  wide: 24,
} as const;

export type WindowLayout = {
  width: number;
  height: number;
  /** width < BREAKPOINTS.narrow */
  isNarrow: boolean;
  /** width >= BREAKPOINTS.wide (e.g. Fold open) */
  isWide: boolean;
  /** Useful for Hôm nay: hero | hours side-by-side */
  useTwoColumn: boolean;
  contentMaxWidth: number;
  horizontalPadding: number;
  /** Compact typography tweaks for ~320px */
  titleSize: number;
  bodySize: number;
};

export function computeWindowLayout(width: number, height: number): WindowLayout {
  const isNarrow = width < BREAKPOINTS.narrow;
  const isWide = width >= BREAKPOINTS.wide;
  const useTwoColumn = width >= BREAKPOINTS.wide;
  const horizontalPadding = isNarrow
    ? GUTTER.narrow
    : isWide
      ? GUTTER.wide
      : GUTTER.default;

  return {
    width,
    height,
    isNarrow,
    isWide,
    useTwoColumn,
    contentMaxWidth: isWide ? CONTENT_MAX_WIDTH_WIDE : CONTENT_MAX_WIDTH,
    horizontalPadding,
    titleSize: isNarrow ? 20 : 24,
    bodySize: isNarrow ? 14 : 15,
  };
}

/** Reference widths for manual QA / Jest */
export const TEST_WIDTHS = {
  foldCoverApprox: 320,
  barPhone: 360,
  largePhone: 414,
  foldOpenApprox: 720,
  tablet: 900,
} as const;
