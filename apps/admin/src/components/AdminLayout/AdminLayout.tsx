import { BaseLayout, Header } from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, useTranslation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import React, { ReactNode } from 'react';
import styles from './styles/AdminLayout.module.scss';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();

  const breadcrumbs = [
    { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    { id: 'admin', label: t('BREADCRUMB_ADMIN'), isCurrentPage: true },
  ];

  return (
    <BaseLayout
      header={
        <Header breadcrumbItems={breadcrumbs} userMenu={<UserGlobalAction />} />
      }
      main={
        <div
          id="admin-layout-main"
          data-testid="admin-layout-main-test-id"
          aria-label="Admin Main Area"
          className={styles.main}
        >
          {children}
        </div>
      }
    />
  );
};
