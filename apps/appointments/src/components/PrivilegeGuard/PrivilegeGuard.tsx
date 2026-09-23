import { Loading } from '@bahmni/design-system';
import {
  type AccessDeniedRouteState,
  HOME_ROUTE_PATH,
  hasPrivilege,
  useTranslation,
} from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APPOINTMENTS_PRIVILEGE } from '../../constants/app';

export interface PrivilegeGuardProps {
  children: ReactNode;
}

export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { userPrivileges, isLoading, error } = useUserPrivilege();

  if (isLoading || (userPrivileges === null && !error)) {
    return <Loading testId="appointments-privilege-guard-loading-test-id" />;
  }

  if (!hasPrivilege(userPrivileges, APPOINTMENTS_PRIVILEGE)) {
    // Redirect first, then let the home app raise the notification. The
    // notification cannot be raised here: NotificationProvider is scoped per
    // app, so anything shown in appointments is torn down by this navigation.
    // The app label is passed already translated — appointments owns that
    // string, home owns the message it is interpolated into.
    const state: AccessDeniedRouteState = {
      accessDenied: { app: t('BREADCRUMB_APPOINTMENTS') },
    };
    return <Navigate to={HOME_ROUTE_PATH} replace state={state} />;
  }

  return children;
};
