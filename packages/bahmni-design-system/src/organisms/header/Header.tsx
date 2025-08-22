import {
  HeaderContainer,
  Header as CarbonHeader,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Breadcrumb,
  BreadcrumbItem,
} from '@carbon/react';
import React from 'react';
import { Icon, ICON_SIZE } from '../../molecules/icon';
import { HeaderProps } from './models';
import styles from './styles/Header.module.scss';
import { useHeaderSideNav } from './useHeaderSideNav';
import { isMobile } from './utils';

/**
 * Header component combines a header with side navigation, breadcrumbs, and global actions.
 * It provides a consistent navigation experience for the application.
 *
 * @component
 * @param {HeaderProps} props - The component props
 * @returns {React.ReactElement} The rendered component
 */
export const Header: React.FC<HeaderProps> = React.memo(
  ({
    breadcrumbItems = [],
    globalActions = [],
    sideNavItems = [],
    activeSideNavItemId = null,
    onSideNavItemClick = () => {},
    isRail = false,
    ariaLabel = 'Header',
  }) => {
    const { isSideNavExpanded, handleSideNavItemClick } =
      useHeaderSideNav(onSideNavItemClick);

    const renderBreadcrumbs = () => {
      if (breadcrumbItems.length === 0) return null;

      return (
        <Breadcrumb
          noTrailingSlash
          data-testid="breadcrumb"
          className={styles.breadcrumb}
        >
          {breadcrumbItems.map((item) => (
            <BreadcrumbItem
              key={item.id}
              href={item.href}
              isCurrentPage={item.isCurrentPage}
            >
              {item.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      );
    };

    const renderGlobalActions = () => {
      if (globalActions.length === 0) return null;

      return (
        <HeaderGlobalBar data-testid="header-global-bar">
          {globalActions.map((action) => (
            <HeaderGlobalAction
              key={action.id}
              aria-label={action.label}
              onClick={action.onClick}
              tooltipAlignment="end"
              data-testid={`global-action-${action.id}`}
            >
              {action.renderIcon}
            </HeaderGlobalAction>
          ))}
        </HeaderGlobalBar>
      );
    };

    const renderSideNav = () => {
      if (sideNavItems.length === 0) return null;

      return (
        <SideNav
          aria-label={'SIDE_NAVIGATION'}
          expanded={isSideNavExpanded && !isRail}
          isPersistent
          isRail={isRail || isMobile()}
          data-testid="side-nav"
          className={styles.sideNavItems}
        >
          <SideNavItems>
            {sideNavItems.map((item) => (
              <SideNavLink
                key={item.id}
                renderIcon={() => (
                  <Icon
                    name={item.icon}
                    id={`sidebar-icon-${item.id}`}
                    size={ICON_SIZE.LG}
                  />
                )}
                href={item.href ?? '#'}
                onClick={(e) => handleSideNavItemClick(e, item.id)}
                isActive={item.id === activeSideNavItemId}
                data-testid={`sidenav-item-${item.id}`}
                large
              >
                {item.label}
              </SideNavLink>
            ))}
          </SideNavItems>
        </SideNav>
      );
    };

    return (
      <HeaderContainer
        render={() => (
          <CarbonHeader aria-label={ariaLabel} data-testid="header">
            {renderBreadcrumbs()}
            {renderGlobalActions()}
            {renderSideNav()}
          </CarbonHeader>
        )}
      />
    );
  },
);

Header.displayName = 'Header';
export default Header;
