import { useContext } from 'react';
import { EocContext, EocContextType } from '../contexts/EocContext';

export const useEocData = (): EocContextType => {
  const context = useContext(EocContext);

  if (context === undefined) {
    throw new Error(
      'useEocData must be used within an EocProvider',
    );
  }

  return context;
};
