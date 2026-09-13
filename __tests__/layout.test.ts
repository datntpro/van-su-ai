import {
  BREAKPOINTS,
  CONTENT_MAX_WIDTH,
  CONTENT_MAX_WIDTH_WIDE,
  TEST_WIDTHS,
  computeWindowLayout,
} from '../src/theme/layout';

describe('computeWindowLayout', () => {
  it('treats fold cover (~320) as narrow, single column', () => {
    const L = computeWindowLayout(TEST_WIDTHS.foldCoverApprox, 700);
    expect(L.isNarrow).toBe(true);
    expect(L.isWide).toBe(false);
    expect(L.useTwoColumn).toBe(false);
    expect(L.horizontalPadding).toBe(12);
    expect(L.titleSize).toBe(20);
  });

  it('treats bar phone (~360) as phone, not wide', () => {
    const L = computeWindowLayout(TEST_WIDTHS.barPhone, 740);
    expect(L.isNarrow).toBe(false);
    expect(L.width).toBeLessThan(BREAKPOINTS.wide);
    expect(L.useTwoColumn).toBe(false);
  });

  it('enables 2-column and wider max on fold open (~720)', () => {
    const L = computeWindowLayout(TEST_WIDTHS.foldOpenApprox, 800);
    expect(L.isWide).toBe(true);
    expect(L.useTwoColumn).toBe(true);
    expect(L.contentMaxWidth).toBe(CONTENT_MAX_WIDTH_WIDE);
    expect(L.horizontalPadding).toBe(24);
  });

  it('caps content width below full tablet width', () => {
    const L = computeWindowLayout(TEST_WIDTHS.tablet, 1200);
    expect(L.contentMaxWidth).toBeLessThanOrEqual(CONTENT_MAX_WIDTH_WIDE);
    expect(L.contentMaxWidth).toBeGreaterThanOrEqual(CONTENT_MAX_WIDTH);
  });
});
