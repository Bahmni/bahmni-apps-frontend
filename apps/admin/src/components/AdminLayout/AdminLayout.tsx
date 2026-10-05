import { BaseLayout, Header } from '@bahmni/design-system';
import {
  BAHMNI_APP_BASE_PATH,
  BAHMNI_HOME_PATH,
  useTranslation,
} from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import React, { ReactNode, useMemo } from 'react';
import styles from './styles/AdminLayout.module.scss';

interface AdminCurrentPage {
  id: string;
  label: string;
}

interface AdminLayoutProps {
  children: ReactNode;
  currentPage?: AdminCurrentPage;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentPage,
}) => {
  const { t } = useTranslation();

  const breadcrumbs = useMemo(
    () => [
      { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
      currentPage
        ? {
            id: 'admin',
            label: t('BREADCRUMB_ADMIN'),
            href: `${BAHMNI_APP_BASE_PATH}/admin`,
          }
        : { id: 'admin', label: t('BREADCRUMB_ADMIN'), isCurrentPage: true },
      ...(currentPage ? [{ ...currentPage, isCurrentPage: true }] : []),
    ],
    [t, currentPage],
  );

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
