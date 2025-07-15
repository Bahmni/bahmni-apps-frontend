import {
  HeaderContainer,
  Header,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Breadcrumb,
  BreadcrumbItem,
} from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';
import { useHeaderSideNav } from '@hooks/useHeaderSideNav';
import { HeaderWSideNavProps } from '@types/headerSideNav';
import { isMobile } from '@utils/common';
import * as styles from './styles/HeaderWSideNav.module.scss';

/**
 * HeaderWSideNav component combines a header with side navigation, breadcrumbs, and global actions.
 * It provides a consistent navigation experience for the application.
 *
 * @component
 * @param {HeaderWSideNavProps} props - The component props
 * @returns {React.ReactElement} The rendered component
 */
const HeaderWSideNav: React.FC<HeaderWSideNavProps> = ({
  breadcrumbItems = [],
  globalActions = [],
  sideNavItems,
  activeSideNavItemId = null,
  onSideNavItemClick,
  isRail = false,
  ariaLabel = 'HeaderWSideNav',
}) => {
  const { t } = useTranslation();
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
            {t(item.label)}
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
            aria-label={t(action.label)}
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
    return (
      <SideNav
        aria-label={t('SIDE_NAVIGATION')}
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
                <BahmniIcon
                  name={item.icon}
                  id={`sidebar-icon-${item.id}`}
                  size={ICON_SIZE.LG}
                />
              )}
              href={item.href || '#'}
              onClick={(e) => handleSideNavItemClick(e, item.id)}
              isActive={item.id === activeSideNavItemId}
              data-testid={`sidenav-item-${item.id}`}
              large
            >
              {t(item.label)}
            </SideNavLink>
          ))}
        </SideNavItems>
      </SideNav>
    );
  };

  return (
    <HeaderContainer
      render={() => (
        <Header aria-label={ariaLabel} data-testid="header">
          {renderBreadcrumbs()}
          {renderGlobalActions()}
          {renderSideNav()}
        </Header>
      )}
    />
  );
};

export default React.memo(HeaderWSideNav);
