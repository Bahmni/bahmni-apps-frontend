import { useContext } from 'react';
import {
  PersonAttributesContext,
  PersonAttributesContextType,
} from '../contexts/PersonAttributesContext';

/**
 * Custom hook to access the person attributes context
 * @returns The person attributes context values including attributes, loading state, error, and refetch
 * @throws Error if used outside PersonAttributesProvider
 */
export const usePersonAttributes = (): PersonAttributesContextType => {
  const context = useContext(PersonAttributesContext);

  if (!context) {
    throw new Error(
      'usePersonAttributes must be used within a PersonAttributesProvider',
    );
  }

  return context;
};
