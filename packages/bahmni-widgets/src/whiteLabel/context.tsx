import { createContext } from 'react';
import { type WhiteLabelContextType } from './models';

export const WhiteLabelContext = createContext<
  WhiteLabelContextType | undefined
>(undefined);
