import { Header, Icon, ICON_SIZE } from '@bahmni/design-system';
import React, { useMemo } from 'react';
import { BAHMNI_HOME_PATH } from '../../constants/app';
import styles from './styles/OrdersHeader.module.scss';

export const OrdersHeader: React.FC = () => {
  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: 'Home', href: BAHMNI_HOME_PATH },
      { id: 'orders', label: 'Orders', isCurrentPage: true },
    ],
    [],
  );
  const globalActions = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search',
        renderIcon: (
          <Icon id="search-icon" name="fa-search" size={ICON_SIZE.LG} />
        ),
        onClick: () => {
          // Search functionality placeholder
        },
      },
      {
        id: 'notifications',
        label: 'Notifications',
        renderIcon: (
          <Icon id="notification-icon" name="fa-bell" size={ICON_SIZE.LG} />
        ),
        onClick: () => {
          // Notifications functionality placeholder
        },
      },
      {
        id: 'user',
        label: 'User',
        renderIcon: <Icon id="user-icon" name="fa-user" size={ICON_SIZE.LG} />,
        onClick: () => {
          // User menu functionality will be implemented later
        },
      },
    ],
    [],
  );
  return (
    <div className={styles.headerContainer}>
      <Header
        breadcrumbItems={breadcrumbItems}
        globalActions={globalActions}
        sideNavItems={[]}
        ariaLabel="Orders Header"
      />
    </div>
  );
};
