import { useContext } from 'react';
import { ActivePractitionerContext } from './ActivePractitionerContext';

/**
 * Custom hook to access the active practitioner context
 * @throws {Error} If used outside of ActivePractitionerProvider
 * @returns Object containing practitioner, user, loading state, error state, and refetch function
 */
export const useActivePractitioner = () => {
  const context = useContext(ActivePractitionerContext);

  if (context === undefined) {
    throw new Error(
      'useActivePractitioner must be used within ActivePractitionerProvider',
    );
  }

  return context;
};
