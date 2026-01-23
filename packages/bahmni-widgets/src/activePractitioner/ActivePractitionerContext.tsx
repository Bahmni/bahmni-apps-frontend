import { Provider, User } from '@bahmni/services';
import { createContext } from 'react';

export interface ActivePractitionerContextType {
  practitioner: Provider | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const ActivePractitionerContext = createContext<
  ActivePractitionerContextType | undefined
>(undefined);
