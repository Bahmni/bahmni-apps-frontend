import { useContext } from 'react';
import { UserActionContext } from './context';

export const useUserActionRegistry = () => {
  const context = useContext(UserActionContext);

  if (context === undefined) {
    throw new Error(
      'useUserActionRegistry must be used within UserActionProvider',
    );
  }

  return context;
};
