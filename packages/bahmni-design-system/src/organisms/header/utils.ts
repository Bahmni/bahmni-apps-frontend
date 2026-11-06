import { breakpoints, baseFontSize } from '@carbon/layout';

export function isMobile(): boolean {
  const breakpointWidth = Number.parseInt(breakpoints.lg.width);
  const isMobile = window.innerWidth < breakpointWidth * baseFontSize;
  return isMobile;
}
