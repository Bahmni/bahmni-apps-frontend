import {
  getFormattedError,
  getPersonAttributeTypes,
  notificationService,
  PersonAttributeType,
} from '@bahmni/services';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  const [isLoading, setIsLoading] = useState(!initialAttributes);
  const [error, setError] = useState<Error | null>(null);

  const fetchAttributes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPersonAttributeTypes(); //TODO Use TanStack Query
      setPersonAttributes(response.results ?? []);
    } catch (error) {
      const { title, message } = getFormattedError(error);
      const errorObj = new Error(message);
      setError(errorObj);
      notificationService.showError(title, message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    // Only fetch if no initial attributes provided
    if (!initialAttributes) {
      fetchAttributes();
    }
  }, [fetchAttributes, initialAttributes]);

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
