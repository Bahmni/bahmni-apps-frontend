import { Loading } from '@bahmni/design-system';
import { hasPrivilege } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { REPORTS_PRIVILEGE } from '../../constants/app';

interface PrivilegeGuardProps {
  children: ReactNode;
}

/**
 * Guards the reports app routes behind the `app:reports` privilege.
 *
 * `UserPrivilegeProvider` starts with `userPrivileges = null` and
 * `isLoading = false`, so `userPrivileges === null` (not `isLoading`) is the
 * signal that privileges have not settled yet. Checking `hasPrivilege`
 * before that settles would redirect every user on first paint.
 */
export const PrivilegeGuard: React.FC<PrivilegeGuardProps> = ({ children }) => {
  const { userPrivileges, error } = useUserPrivilege();

  // null = provider hasn't settled yet; [] = user has no privileges
  if (userPrivileges === null && !error) {
    return <Loading testId="privilege-guard-loading-test-id" />;
  }

  if (!hasPrivilege(userPrivileges, REPORTS_PRIVILEGE)) {
    return <Navigate to="/home/" replace />;
  }

  return children;
};
