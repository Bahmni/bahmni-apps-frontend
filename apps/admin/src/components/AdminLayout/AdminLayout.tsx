import { BaseLayout, Header } from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, useTranslation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import React, { ComponentProps, ReactNode, useMemo } from 'react';
import styles from './styles/AdminLayout.module.scss';

type BreadcrumbItems = ComponentProps<typeof Header>['breadcrumbItems'];

interface AdminLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItems;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  breadcrumbs: customBreadcrumbs,
}) => {
  const { t } = useTranslation();

  const defaultBreadcrumbs = useMemo(
    () => [
      { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
      { id: 'admin', label: t('BREADCRUMB_ADMIN'), isCurrentPage: true },
    ],
    [t],
  );
  const breadcrumbs = customBreadcrumbs ?? defaultBreadcrumbs;

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
