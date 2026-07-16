import { ReactNode, ComponentType } from 'react';

/**
 * Side navigation item for header with side navigation component
 */
export interface HeaderSideNavItem {
  id: string;
  icon: string;
  label: string;
  href?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderIcon?: ComponentType<any>;
}

/**
 * Breadcrumb item for header with side navigation component
 */
export interface HeaderBreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

/**
 * Global action item for header with side navigation component
 */
export interface HeaderGlobalAction {
  id: string;
  label: string;
  renderIcon: ReactNode;
  onClick: () => void;
}

/**
 * Props for the Header component
 */
export interface HeaderProps {
  /**
   * App/brand name rendered on the left as a Carbon `HeaderName`. `brandPrefix`
   * shows as the small prefix label (e.g. "Home") and `brandHref` is its link.
   * Prefer these over composing a `HeaderName` inside `extraContent`.
   */
  brandName?: string;
  brandPrefix?: string;
  brandHref?: string;
  breadcrumbItems?: HeaderBreadcrumbItem[];
  globalActions?: HeaderGlobalAction[];
  /**
   * Self-contained elements (e.g. a location selector) rendered in the global
   * bar before `globalActions`/`userMenu`, without the HeaderGlobalAction
   * icon-button wrapper. Use for controls that manage their own presentation.
   */
  globalFeatures?: ReactNode[];
  sideNavItems?: HeaderSideNavItem[];
  activeSideNavItemId?: string | null;
  onSideNavItemClick?: (itemId: string) => void;
  isRail?: boolean;
  ariaLabel?: string;
  extraContent?: ReactNode;
  /**
   * A self-contained component (e.g. the user menu) rendered directly in the
   * header global bar, without the HeaderGlobalAction icon-button wrapper used
   * for `globalActions`. Use this for elements that already manage their own
   * button and menu.
   */
  userMenu?: ReactNode;
}
