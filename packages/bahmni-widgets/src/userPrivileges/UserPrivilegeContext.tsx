import { UserPrivilege } from '@bahmni-frontend/bahmni-services';
import { createContext } from 'react';

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
