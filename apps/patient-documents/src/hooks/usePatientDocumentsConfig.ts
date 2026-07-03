import { useQuery } from '@tanstack/react-query';
import { getPatientDocumentsConfig } from '../config/documentsConfig';

export const usePatientDocumentsConfig = () =>
  useQuery({
    queryKey: ['patientDocumentsConfig'],
    queryFn: getPatientDocumentsConfig,
  });
