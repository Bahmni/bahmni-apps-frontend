import { useContext } from 'react';
import {
  UserPrivilegeContext,
  UserPrivilegeContextType,
} from '@contexts/UserPrivilegeContext';

export const useUserPrivilege = (): UserPrivilegeContextType => {
  const context = useContext(UserPrivilegeContext);

  if (!context) {
    throw new Error(
      'useUserPrivilege must be used within a UserPrivilegeProvider',
    );
  }

  return context;
};
