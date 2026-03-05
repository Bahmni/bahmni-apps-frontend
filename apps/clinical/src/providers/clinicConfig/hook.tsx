import { createConfigHook } from '@bahmni/widgets';
import { ClinicalConfigContext } from './context';
import { ClinicalConfigContextType } from './models';

export const useClinicalConfig = createConfigHook<ClinicalConfigContextType>(
  ClinicalConfigContext,
  'useClinicalConfig',
  'ClinicalConfigProvider',
);
