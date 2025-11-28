import {
  getFormattedError,
  getPersonAttributeTypes,
  notificationService,
  PersonAttributeType,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { PersonAttributesContext } from '../contexts/PersonAttributesContext';

interface PersonAttributesProviderProps {
  children: ReactNode;
  initialAttributes?: PersonAttributeType[];
}

export const PersonAttributesProvider: React.FC<
  PersonAttributesProviderProps
> = ({ children, initialAttributes }) => {
  const [personAttributes, setPersonAttributes] = useState<
    PersonAttributeType[]
  >(initialAttributes ?? []);

  const {
    data: queryData,
    isLoading: queryIsLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['personAttributeTypes'],
    queryFn: async () => {
      const response = await getPersonAttributeTypes();
      return response.results ?? [];
    },
    enabled: !initialAttributes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Update personAttributes when query data changes
  useEffect(() => {
    if (queryData && !initialAttributes) {
      setPersonAttributes(queryData);
    }
  }, [queryData, initialAttributes]);

  // Show error notifications
  useEffect(() => {
    if (queryError) {
      const { title, message } = getFormattedError(queryError);
      notificationService.showError(title, message);
    }
  }, [queryError]);

  const isLoading = initialAttributes ? false : queryIsLoading;
  const error = queryError ? new Error(String(queryError)) : null;

  const setIsLoading = () => {};
  const setError = () => {};

  // Refetch wrapper to maintain async signature
  const refetch = async () => {
    await queryRefetch();
  };

  const value = useMemo(
    () => ({
      personAttributes,
      setPersonAttributes,
      isLoading,
      setIsLoading,
      error,
      setError,
      refetch,
    }),
    [personAttributes, isLoading, error, refetch],
  );

  return (
    <PersonAttributesContext.Provider value={value}>
      {children}
    </PersonAttributesContext.Provider>
  );
};

PersonAttributesProvider.displayName = 'PersonAttributesProvider';
