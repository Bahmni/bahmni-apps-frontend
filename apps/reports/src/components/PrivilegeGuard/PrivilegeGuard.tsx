import { Loading } from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  hasPrivilege,
  useTranslation,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode, useEffect } from 'react';
import { REPORTS_PRIVILEGE } from '../../constants/app';
import styles from './styles/PrivilegeGuard.module.scss';

interface PrivilegeGuardProps {
  children: ReactNode;
}

export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { userPrivileges, error } = useUserPrivilege();
  const { addNotification } = useNotification();

  const isDenied =
    userPrivileges !== null && !hasPrivilege(userPrivileges, REPORTS_PRIVILEGE);

  useEffect(() => {
    if (isDenied) {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_PRIVILEGE_DENIED_ERROR'),
        type: 'error',
      });
    }
  }, [isDenied, addNotification, t]);

  // null = provider hasn't settled yet; [] = user has no privileges
  if (userPrivileges === null && !error) {
    return <Loading testId="privilege-guard-loading-test-id" />;
  }

  if (error || isDenied) {
    return (
      <div
        role="alert"
        className={styles.accessMessage}
        data-testid="privilege-guard-denied"
      >
        <p>
          {error
            ? t('REPORTS_PRIVILEGE_LOAD_ERROR')
            : t('REPORTS_PRIVILEGE_DENIED_ERROR')}
        </p>
        <a href={BAHMNI_HOME_PATH}>{t('REPORTS_BACK_TO_HOME_LINK')}</a>
      </div>
    );
  }

  return children;
};
