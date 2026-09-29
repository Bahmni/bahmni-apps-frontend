import { Loading } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode, useEffect } from 'react';
import { REPORTS_PRIVILEGE } from '../../constants/app';

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
    if (error) {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_PRIVILEGE_LOAD_ERROR'),
        type: 'error',
      });
    } else if (isDenied) {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_PRIVILEGE_DENIED_ERROR'),
        type: 'error',
      });
    }
  }, [error, isDenied, addNotification, t]);

  // null = provider hasn't settled yet; [] = user has no privileges
  if (userPrivileges === null && !error) {
    return <Loading testId="privilege-guard-loading-test-id" />;
  }

  if (error || isDenied) {
    return null;
  }

  return children;
};
