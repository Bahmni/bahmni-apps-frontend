import {
  getVisitTypes,
  checkIfActiveVisitExists,
  createVisitForPatient,
  getActiveVisitByPatient,
  searchEncounters,
  updateFhirEncounter,
  useTranslation,
  type VisitType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useRegistrationConfig } from '../providers/registrationConfig';

export const useVisitTypes = () => {
  const { data: visitTypes, isLoading } = useQuery({
    queryKey: ['visitTypes'],
    queryFn: getVisitTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    visitTypes,
    isLoading,
  };
};

export const useActiveVisit = (patientUuid?: string) => {
  const { data: hasActiveVisit, isLoading } = useQuery({
    queryKey: ['hasActiveVisit', patientUuid],
    queryFn: () => checkIfActiveVisitExists(patientUuid!),
    enabled: Boolean(patientUuid),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { hasActiveVisit, isLoading };
};

export const useCreateVisit = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { patientUuid } = useParams<{ patientUuid: string }>();
  const { hasActiveVisit } = useActiveVisit(patientUuid);
  const queryClient = useQueryClient();
  const { registrationConfig } = useRegistrationConfig();

  const createVisit = async (patientUuid: string, visitType: VisitType) => {
    try {
      if (hasActiveVisit) {
        return;
      }
      await createVisitForPatient(patientUuid, visitType);
      await queryClient.invalidateQueries({
        queryKey: ['hasActiveVisit', patientUuid],
      });

      const encounterTypeUuid =
        registrationConfig?.registrationEncounterTypeUuid;
      if (encounterTypeUuid) {
        try {
          const activeVisit = await getActiveVisitByPatient(patientUuid);
          const visitResult = activeVisit?.results?.[0];
          const visitUuid = visitResult?.uuid;
          if (!visitUuid) return;

          const encounters = await searchEncounters({
            patient: patientUuid,
            type: encounterTypeUuid,
          });
          const unlinkedEncounter = encounters.find((e) => !e.partOf);
          if (!unlinkedEncounter?.id) return;

          await updateFhirEncounter(unlinkedEncounter.id, {
            ...unlinkedEncounter,
            period: {
              start: new Date(visitResult.startDatetime).toISOString(),
            },
            partOf: { reference: `Encounter/${visitUuid}` },
          });
        } catch {
          // Silently fail — encounter-visit linkage failure should not disrupt visit creation
        }
      }
    } catch (error) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
        timeout: 5000,
      });
    }
  };

  return { createVisit };
};
