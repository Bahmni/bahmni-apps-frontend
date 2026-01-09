import {
  getVisitTypes,
  checkIfActiveVisitExists,
  createVisitForPatient,
  useTranslation,
  type VisitType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

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

  const createVisit = async (patientUuid: string, visitType: VisitType) => {
    try {
      if (hasActiveVisit) {
        return;
      }
      await createVisitForPatient(patientUuid, visitType);
      await queryClient.invalidateQueries({
        queryKey: ['hasActiveVisit', patientUuid],
      });
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
