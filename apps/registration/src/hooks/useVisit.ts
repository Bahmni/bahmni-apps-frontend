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
// the "new patient" route to the "existing patient" route mid-click. Uses a
// static key (not scoped to patientUuid) because the flag must be set by the
// caller *before* the patient uuid is known (see RegistrationActions.tsx).
export const useIsCreatingVisit = () => {
  const { data } = useQuery({
    queryKey: ['startVisitInProgress'],
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

  // Marks the patient as having an active visit. In-flight hasActiveVisit
  // queries are cancelled first so a stale `false` response that resolves
  // later cannot overwrite the `true` and re-enable the Start Visit button.
  const markVisitActive = async (patientUuid: string) => {
    await queryClient.cancelQueries({
      queryKey: ['hasActiveVisit', patientUuid],
    });
    queryClient.setQueryData(['hasActiveVisit', patientUuid], true);
  };

  const createVisit = async (patientUuid: string, visitType: VisitType) => {
    if (queryClient.getQueryData(['hasActiveVisit', patientUuid])) {
      return;
    }

    try {
      // Re-check the server: the cache may hold a stale/absent value while the
      // visit already exists (e.g. a rapid second click after navigation).
      const alreadyActive = await checkIfActiveVisitExists(patientUuid);
      if (alreadyActive) {
        await markVisitActive(patientUuid);
        return;
      }

      const createdVisit = await createVisitForPatient(patientUuid, visitType);
      await markVisitActive(patientUuid);

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
    }
  };

  return { createVisit };
};
