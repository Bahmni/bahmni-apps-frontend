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
 * `useUserPrivilege()` starts with `isLoading === false` and
 * `userPrivileges === null` on first render — `isLoading` only flips to
 * `true` inside the provider's mount effect, which runs after the first
 * paint. So on that first frame `isLoading` is false and `userPrivileges`
 * is null; `hasPrivilege` treats `null` as "no privileges", so gating on
 * `isLoading` alone would let every authorized admin hit the denial
 * screen for that frame. The loading branch therefore also checks
 * `userPrivileges === null` directly, independent of `isLoading`.
 *
 * A failed privilege fetch (network error, 500) also leaves
 * `userPrivileges` `null`, but with `error` set — the `!error` clause
 * excludes that case from the loading branch so it falls through to the
 * authorization check below, which renders a distinct "couldn't verify
 * access" message instead of the misleading access-denied copy.
 *
 * Denial renders in place rather than redirecting to home. Notification
 * state lives in each app's own `NotificationProvider`, so a message
 * raised here would be destroyed the moment a redirect unmounted the
 * admin app — leaving the user bounced with no explanation. Rendering the
 * message inside `AdminLayout` keeps it visible and keeps the `Home`
 * breadcrumb available as the way back. This mirrors the behaviour of the
 * legacy AngularJS admin module. Also it is consistent with the behaviour
 * of the appointments admin pages.
 */
export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { userPrivileges, isLoading, error } = useUserPrivilege();
  const isAuthorized = hasPrivilege(userPrivileges, ADMIN_PRIVILEGE);

  if (isLoading || (userPrivileges === null && !error)) {
    return <Loading testId="admin-privilege-guard-loading-test-id" />;
  }

  if (error) {
    return (
      <AdminLayout>
        <div
          id="admin-privilege-check-failed"
          data-testid="admin-privilege-check-failed-test-id"
          aria-label="admin-privilege-check-failed-aria-label"
          className={styles.accessDenied}
          role="alert"
        >
          <h2 className={styles.title}>
            {t('ADMIN_PRIVILEGE_CHECK_FAILED_TITLE')}
          </h2>
          <p className={styles.message}>
            {t('ADMIN_PRIVILEGE_CHECK_FAILED_MESSAGE')}
          </p>
        </div>
      </AdminLayout>
    );
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
