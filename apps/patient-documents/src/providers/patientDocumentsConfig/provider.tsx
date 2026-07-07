import { createConfigProvider } from '@bahmni/widgets';
import {
  getPatientDocumentsConfig,
  PatientDocumentsConfig,
} from '../../config/documentsConfig';
import { PatientDocumentsConfigContext } from './context';
import { PatientDocumentsConfigContextType } from './models';

export const PatientDocumentsConfigProvider = createConfigProvider<
  PatientDocumentsConfig,
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
  id: 'patient-documents-config',
  name: 'Patient Documents Config',
  displayName: 'PatientDocumentsConfigProvider',
});
