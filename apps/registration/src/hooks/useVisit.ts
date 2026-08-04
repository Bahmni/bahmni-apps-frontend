import {
  getVisitTypes,
  checkIfActiveVisitExists,
  createVisitForPatient,
  useTranslation,
  type VisitType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createRegistrationEncounterForPatient } from '../services/registrationEncounterService';
import { useRegistrationEncounterTypeUuid } from './useRegistrationEncounterTypeUuid';

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

// Backed by the shared QueryClient cache (not component state) so the
// in-flight flag survives the remount that happens when navigating from
// the "new patient" route to the "existing patient" route mid-click.
export const useIsCreatingVisit = (patientUuid?: string) => {
  const { data } = useQuery({
    queryKey: ['isCreatingVisit', patientUuid],
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });

  return Boolean(data);
};

export const useCreateVisit = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const encounterTypeUuid = useRegistrationEncounterTypeUuid();

  const createVisit = async (patientUuid: string, visitType: VisitType) => {
    if (
      queryClient.getQueryData(['isCreatingVisit', patientUuid]) ||
      queryClient.getQueryData(['hasActiveVisit', patientUuid])
    ) {
      return;
    }

    queryClient.setQueryData(['isCreatingVisit', patientUuid], true);
    try {
      const createdVisit = await createVisitForPatient(patientUuid, visitType);
      queryClient.setQueryData(['hasActiveVisit', patientUuid], true);

      if (encounterTypeUuid) {
        try {
          await createRegistrationEncounterForPatient(
            patientUuid,
            encounterTypeUuid,
            {
              visitUuid: createdVisit.uuid,
              periodStart: createdVisit.startDatetime,
            },
          );
        } catch (error) {
          addNotification({
            title: t('ERROR_DEFAULT_TITLE'),
            message: error instanceof Error ? error.message : String(error),
            type: 'error',
            timeout: 5000,
          });
        }
      }
    } catch (error) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
        timeout: 5000,
      });
    } finally {
      queryClient.setQueryData(['isCreatingVisit', patientUuid], false);
    }
  };

  return { createVisit };
};
