import { useQuery } from '@tanstack/react-query';
import { useRegistrationConfig } from '../providers/registrationConfig';
import { getEncounterTypeUuidByName } from '../services/registrationEncounterService';

export const useRegistrationEncounterTypeUuid = (): string | undefined => {
  const { registrationConfig } = useRegistrationConfig();
  const encounterTypeName = registrationConfig?.registrationEncounterType;

  const { data: encounterTypeUuid } = useQuery({
    queryKey: ['encounterType', encounterTypeName],
    queryFn: () => getEncounterTypeUuidByName(encounterTypeName!),
    enabled: !!encounterTypeName,
    staleTime: 5 * 60 * 1000,
  });

  return encounterTypeUuid;
};
