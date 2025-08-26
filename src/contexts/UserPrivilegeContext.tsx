import { createContext } from 'react';
import { UserPrivilege } from '@components/clinical/forms/observationForms/utils/privilegeUtils';

export interface UserPrivilegeContextType {
  userPrivileges: UserPrivilege[] | null;
  setUserPrivileges: (privileges: UserPrivilege[] | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
}

export const UserPrivilegeContext = createContext<
  UserPrivilegeContextType | undefined
>(undefined);
