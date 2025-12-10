import { useContext } from 'react';
import {
  ClinicalAppContext,
  ClinicalAppContextType,
} from '../contexts/ClinicalAppContext';

export const useClinicalAppData = (): ClinicalAppContextType => {
  const context = useContext(ClinicalAppContext);

  if (context === undefined) {
    throw new Error(
      'useClinicalAppsData must be used within a ClinicalAppsProvider',
    );
  }

  return context;
};
