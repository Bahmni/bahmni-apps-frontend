import { useContext } from 'react';
import {
  ClinicalAppsContext,
  ClinicalAppsContextType,
} from '../contexts/ClinicalAppsContext';

export const useClinicalAppsData = (): ClinicalAppsContextType => {
  const context = useContext(ClinicalAppsContext);

  if (context === undefined) {
    throw new Error(
      'useClinicalAppsData must be used within a ClinicalAppsProvider',
    );
  }

  return context;
};
