import { Loading } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APPOINTMENTS_PRIVILEGE } from '../../constants/app';

// Router-absolute path — the distro `BrowserRouter` already applies the
// `/bahmni-v2/` basename, so this resolves to `/bahmni-v2/home/`.
const HOME_ROUTE_PATH = '/home/';

export interface PrivilegeGuardProps {
  children: ReactNode;
}

export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { t } = useTranslation();
  const { userPrivileges, isLoading } = useUserPrivilege();

  const hasAccess = hasPrivilege(userPrivileges, APPOINTMENTS_PRIVILEGE);

  if (isLoading) {
    return <Loading testId="appointments-privilege-guard-loading-test-id" />;
  }

  if (!hasAccess) {
    // Redirect first, then let the home app raise the notification. The
    // notification cannot be raised here: NotificationProvider is scoped per
    // app, so anything shown in appointments is torn down by this navigation.
    // The app label is passed already translated — appointments owns that
    // string, home owns the message it is interpolated into.
    return (
      <Navigate
        to={HOME_ROUTE_PATH}
        replace
        state={{ accessDenied: { app: t('BREADCRUMB_APPOINTMENTS') } }}
      />
    );
  }

  return children;
};
