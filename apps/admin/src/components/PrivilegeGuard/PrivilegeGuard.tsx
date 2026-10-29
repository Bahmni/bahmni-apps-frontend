import { Loading } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode, useEffect } from 'react';
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
 * screen for that frame. `isResolved` therefore also checks
 * `userPrivileges !== null`, independent of `isLoading`.
 *
 * A failed privilege fetch (network error, 500) also leaves
 * `userPrivileges` `null`, but with `error` set — the `|| error` clause
 * marks that case resolved too, so it falls through to a distinct
 * "couldn't verify access" fallback instead of the misleading
 * access-denied copy. That case doesn't raise a toast here:
 * `UserPrivilegeProvider`'s catch block already surfaces one for the
 * same failure, and stacking a second, differently-worded toast on top
 * would be redundant.
 *
 * Denial is surfaced as a top-right error toast — the same notification
 * design used elsewhere in the app suite (e.g. registration's
 * mandatory-field validation, clinical's dashboard load errors) — rather
 * than a redirect, so the page stays mounted and the `Home` breadcrumb
 * inside `AdminLayout` remains available as the way back.
 *
 * The toast has no timeout, so it can be dismissed manually; once it is,
 * the visually-hidden fallback rendered alongside `AdminLayout` is the only
 * remaining explanation. It therefore carries the full title and message
 * (not just the title) and `role="status"`/`aria-live="polite"`, so it
 * still functions — and gets announced to assistive tech — independent of
 * whether the toast is still visible.
 */
export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { userPrivileges, isLoading, error } = useUserPrivilege();
  const isAuthorized = hasPrivilege(userPrivileges, ADMIN_PRIVILEGE);
  const isResolved = !isLoading && (userPrivileges !== null || !!error);

  useEffect(() => {
    if (!isResolved) return;

    // A fetch failure already gets its own toast from
    // `UserPrivilegeProvider`'s catch block — don't stack a second one here.
    if (error) return;

    if (!isAuthorized) {
      addNotification({
        title: t('ADMIN_ACCESS_DENIED_TITLE'),
        message: t('ADMIN_ACCESS_DENIED_MESSAGE'),
        type: 'error',
      });
    }
  }, [isResolved, error, isAuthorized, addNotification, t]);

  if (!isResolved) {
    return <Loading testId="admin-privilege-guard-loading-test-id" />;
  }

  if (error) {
    return (
      <AdminLayout>
        <div
          id="admin-privilege-check-failed"
          data-testid="admin-privilege-check-failed-test-id"
          className={styles.visuallyHidden}
          role="status"
          aria-live="polite"
        >
          <p>{t('ADMIN_PRIVILEGE_CHECK_FAILED_TITLE')}</p>
          <p>{t('ADMIN_PRIVILEGE_CHECK_FAILED_MESSAGE')}</p>
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
          className={styles.visuallyHidden}
          role="status"
          aria-live="polite"
        >
          <p>{t('ADMIN_ACCESS_DENIED_TITLE')}</p>
          <p>{t('ADMIN_ACCESS_DENIED_MESSAGE')}</p>
        </div>
      </AdminLayout>
    );
  }

  return children;
};
