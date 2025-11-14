import { User } from '@bahmni-frontend/bahmni-services';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

export const useUser = (): User | undefined => {
  return useContext(UserContext);
};
