import { getConfig } from '@bahmni/services';
import { createConfigProvider } from '@bahmni/widgets';
import { CLINICAL_CONFIG_URL } from './constants';
import { ClinicalConfigContext } from './context';
import { ClinicalConfig, ClinicalConfigContextType } from './models';
import clinicalConfigSchema from './schema.json';

export const ClinicalConfigProvider = createConfigProvider<
  ClinicalConfig,
  ClinicalConfigContextType
>({
  context: ClinicalConfigContext,
  queryKey: ['clinicalConfig'],
  queryFn: () =>
    getConfig<ClinicalConfig>(CLINICAL_CONFIG_URL, clinicalConfigSchema),
  valueMapper: (clinicalConfig, isLoading, error) => ({
    clinicalConfig,
    isLoading,
    error,
  }),
  id: 'clinical-config',
  name: 'Clinical Config',
  displayName: 'ClinicalConfigProvider',
});
