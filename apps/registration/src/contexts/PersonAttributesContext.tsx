import { PersonAttributeType } from '@bahmni/services';
import { createContext } from 'react';

/**
 * Person attributes context interface
 * Provides access to person attributes with loading and error states
 */
export interface PersonAttributesContextType {
  personAttributes: PersonAttributeType[];
  setPersonAttributes: (attributes: PersonAttributeType[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
  refetch: () => Promise<void>;
}

export const PersonAttributesContext = createContext<
  PersonAttributesContextType | undefined
>(undefined);
