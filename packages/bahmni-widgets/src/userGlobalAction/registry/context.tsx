import { createContext } from 'react';
import { UserAction } from '../models';

export interface UserActionContextType {
  registerAction: (action: UserAction) => void;
  unregisterAction: (id: string) => void;
  getActions: () => UserAction[];
  clear: () => void;
  version: number;
}

export const UserActionContext = createContext<
  UserActionContextType | undefined
>(undefined);
