import { createConfigHook } from '@bahmni/widgets';
import { PatientDocumentsConfigContext } from './context';
import { PatientDocumentsConfigContextType } from './models';

export const usePatientDocumentsConfig =
  createConfigHook<PatientDocumentsConfigContextType>(
    PatientDocumentsConfigContext,
    'usePatientDocumentsConfig',
    'PatientDocumentsConfigProvider',
  );
