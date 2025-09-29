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
  breadcrumbItems?: HeaderBreadcrumbItem[];
  globalActions?: HeaderGlobalAction[];
  sideNavItems?: HeaderSideNavItem[];
  activeSideNavItemId?: string | null;
  onSideNavItemClick?: (itemId: string) => void;
  isRail?: boolean;
  ariaLabel?: string;
}
