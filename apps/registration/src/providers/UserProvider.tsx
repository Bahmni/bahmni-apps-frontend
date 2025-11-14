import { getCurrentUser } from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { UserContext } from '../contexts/UserContext';

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { data: user } = useQuery({
    queryKey: ['userName'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    <UserContext.Provider value={user ?? undefined}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.displayName = 'UserProvider';
