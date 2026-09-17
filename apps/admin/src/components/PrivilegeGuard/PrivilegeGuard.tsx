import { Loading } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode } from 'react';
import { ADMIN_PRIVILEGE } from '../../constants/app';
import { AdminLayout } from '../AdminLayout';
import styles from './styles/PrivilegeGuard.module.scss';

interface PrivilegeGuardProps {
  children: ReactNode;
}

/**
 * Guards admin routes behind the `app:admin` privilege.
 *
 * `useUserPrivilege()` starts with `userPrivileges === null` while the
 * session is being fetched, and `hasPrivilege` treats `null` as "no
 * privileges". Gating on `isLoading` avoids denying every user access to
 * the admin app on first paint, before privileges have resolved.
 *
 * Denial renders in place rather than redirecting to home. Notification
 * state lives in each app's own `NotificationProvider`, so a message
 * raised here would be destroyed the moment a redirect unmounted the
 * admin app — leaving the user bounced with no explanation. Rendering the
 * message inside `AdminLayout` keeps it visible and keeps the `Home`
 * breadcrumb available as the way back. This mirrors the existing
 * behaviour of the appointments admin pages.
 */
export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { userPrivileges, isLoading } = useUserPrivilege();
  const isAuthorized = hasPrivilege(userPrivileges, ADMIN_PRIVILEGE);

  if (isLoading) {
    return <Loading testId="admin-privilege-guard-loading-test-id" />;
  }

  if (!isAuthorized) {
    return (
      <AdminLayout>
        <div
          id="admin-access-denied"
          data-testid="admin-access-denied-test-id"
          aria-label="admin-access-denied-aria-label"
          className={styles.accessDenied}
          role="alert"
        >
          <h2 className={styles.title}>{t('ADMIN_ACCESS_DENIED_TITLE')}</h2>
          <p className={styles.message}>{t('ADMIN_ACCESS_DENIED_MESSAGE')}</p>
        </div>
      </AdminLayout>
    );
  }

  return children;
};
