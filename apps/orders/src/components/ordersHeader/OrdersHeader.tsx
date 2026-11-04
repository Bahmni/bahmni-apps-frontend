import { Header } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useMemo } from 'react';
import { BAHMNI_HOME_PATH } from '../../constants/app';
import styles from './styles/OrdersHeader.module.scss';

export const OrdersHeader: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: t('HOME'), href: BAHMNI_HOME_PATH },
      { id: 'orders', label: t('ORDERS'), isCurrentPage: true },
    ],
    [t],
  );

  return (
    <div className={styles.headerContainer}>
      <Header
        breadcrumbItems={breadcrumbItems}
        globalActions={[]}
        sideNavItems={[]}
        ariaLabel={t('ORDERS_HEADER')}
      />
    </div>
  );
};
