import { BaseLayout, Header } from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, useTranslation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import React, { ReactNode, useMemo } from 'react';
import { APPOINTMENTS_APP_HREF } from '../../constants/app';
import styles from './styles/AppointmentsLayout.module.scss';

export interface AppointmentsBreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface AppointmentsLayoutProps {
  children: ReactNode;
  /**
   * Leaf crumb for a page below the appointments root, e.g. Manage/New/Edit.
   * Renders as Home / Appointments / {label}, with Appointments linked.
   */
  pageBreadcrumb?: { id: string; label: string };
  /** Full breadcrumb override, for pages that need a different trail entirely. */
  breadcrumbItems?: AppointmentsBreadcrumbItem[];
}

export const AppointmentsLayout: React.FC<AppointmentsLayoutProps> = ({
  children,
  pageBreadcrumb,
  breadcrumbItems,
}) => {
  const { t } = useTranslation();
  const pageCrumbId = pageBreadcrumb?.id;
  const pageCrumbLabel = pageBreadcrumb?.label;

  const defaultBreadcrumbItems = useMemo<AppointmentsBreadcrumbItem[]>(() => {
    const homeCrumb = {
      id: 'home',
      label: t('BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    };

    if (pageCrumbId === undefined || pageCrumbLabel === undefined) {
      return [
        homeCrumb,
        {
          id: 'appointments',
          label: t('BREADCRUMB_APPOINTMENTS'),
          isCurrentPage: true,
        },
      ];
    }

    return [
      homeCrumb,
      {
        id: 'appointments',
        label: t('BREADCRUMB_APPOINTMENTS'),
        href: APPOINTMENTS_APP_HREF,
      },
      { id: pageCrumbId, label: pageCrumbLabel, isCurrentPage: true },
    ];
  }, [t, pageCrumbId, pageCrumbLabel]);

  return (
    <BaseLayout
      header={
        <Header
          breadcrumbItems={breadcrumbItems ?? defaultBreadcrumbItems}
          userMenu={<UserGlobalAction />}
        />
      }
      main={
        <div
          id="appointments-layout-content"
          data-testid="appointments-layout-content-test-id"
          aria-label="appointments-layout-content-aria-label"
          className={styles.content}
        >
          {children}
        </div>
      }
    />
  );
};
