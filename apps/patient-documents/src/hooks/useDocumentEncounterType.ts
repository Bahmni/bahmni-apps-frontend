import { EncounterTypeRef, getEncounterTypeByName } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { getPatientDocumentsConfig } from '../config/documentsConfig';

// Reads the document encounter type name from config and resolves it to {uuid, name}.
export const useDocumentEncounterType = (): {
  encounterType: EncounterTypeRef | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const configQuery = useQuery({
    queryKey: ['patientDocumentsConfig'],
    queryFn: getPatientDocumentsConfig,
  });

  const typeName = configQuery.data?.documentEncounterTypeName;

  const encounterTypeQuery = useQuery({
    queryKey: ['encounterType', typeName],
    queryFn: () => getEncounterTypeByName(typeName!),
    enabled: !!typeName,
  });

  return {
    encounterType: encounterTypeQuery.data ?? null,
    isLoading: configQuery.isLoading || encounterTypeQuery.isLoading,
    error: (configQuery.error ?? encounterTypeQuery.error) as Error | null,
  };
};
