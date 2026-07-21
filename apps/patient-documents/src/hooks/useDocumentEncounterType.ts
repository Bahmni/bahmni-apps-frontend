import { EncounterTypeRef, getEncounterTypeByName } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { usePatientDocumentsConfig } from '../providers/patientDocumentsConfig';

// Reads the document encounter type name from config and resolves it to {uuid, name}.
export const useDocumentEncounterType = (): {
  encounterType: EncounterTypeRef | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const { patientDocumentsConfig, isLoading: isConfigLoading } =
    usePatientDocumentsConfig();

  const typeName = patientDocumentsConfig?.documentEncounterTypeName;

  const encounterTypeQuery = useQuery({
    queryKey: ['encounterType', typeName],
    queryFn: () => getEncounterTypeByName(typeName!),
    enabled: !!typeName,
  });

  return {
    encounterType: encounterTypeQuery.data ?? null,
    isLoading: isConfigLoading || encounterTypeQuery.isLoading,
    error: encounterTypeQuery.error as Error | null,
  };
};
