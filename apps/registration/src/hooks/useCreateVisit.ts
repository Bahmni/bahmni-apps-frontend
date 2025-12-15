import {
  useTranslation,
  createVisitForPatient,
  type VisitType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useActiveVisit } from './useActiveVisit';

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
