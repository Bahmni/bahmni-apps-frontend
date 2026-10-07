import { BaseLayout, Header } from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, useTranslation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import React, { ReactNode, useMemo } from 'react';
import { BAHMNI_ADMIN_HOME_PATH } from '../../constants/app';
import styles from './styles/AdminLayout.module.scss';

interface AdminLayoutProps {
  children: ReactNode;
  breadcrumbLabel?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  breadcrumbLabel,
}) => {
  const { t } = useTranslation();

  const breadcrumbs = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      href?: string;
      isCurrentPage?: boolean;
    }> = [
      {
        id: 'home',
        label: t('BREADCRUMB_HOME'),
        href: BAHMNI_HOME_PATH,
      },
      {
        id: 'admin',
        label: t('BREADCRUMB_ADMIN'),
        href: BAHMNI_ADMIN_HOME_PATH,
      },
    ];
    if (breadcrumbLabel) {
      items.push({
        id: 'current',
        label: breadcrumbLabel,
        isCurrentPage: true,
      });
    } else {
      items[items.length - 1].isCurrentPage = true;
    }
    return items;
  }, [t, breadcrumbLabel]);

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
