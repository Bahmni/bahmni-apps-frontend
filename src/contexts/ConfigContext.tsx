import { createContext } from 'react';
import { ConfigContextType } from '@types/config';

export const ConfigContext = createContext<ConfigContextType | undefined>(
  undefined,
);
