import { createConfigProvider } from '@bahmni/widgets';
import { getPatientDocumentsConfig } from '../../config/documentsConfig';
import { PatientDocumentsConfigContext } from './context';
import { PatientDocumentsConfigContextType } from './models';

export const PatientDocumentsConfigProvider = createConfigProvider<
  unknown,
  PatientDocumentsConfigContextType
>({
  context: PatientDocumentsConfigContext,
  queryKey: ['patientDocumentsConfig'],
  queryFn: getPatientDocumentsConfig,
  valueMapper: (patientDocumentsConfig, isLoading, error) => ({
    patientDocumentsConfig,
    isLoading,
    error,
  }),
  id: 'document-upload-config',
  name: 'Patient Documents Config',
  displayName: 'PatientDocumentsConfigProvider',
});
