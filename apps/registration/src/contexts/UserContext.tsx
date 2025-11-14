import { User } from '@bahmni-frontend/bahmni-services';
import { createContext } from 'react';

export const UserContext = createContext<User | undefined>(undefined);
