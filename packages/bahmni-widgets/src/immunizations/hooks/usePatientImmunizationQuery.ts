import {
  ConsultationSavedEventPayload,
  getPatientImmunizations,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

export const usePatientImmunizationQuery = (
  patientUUID: string,
  status: string,
) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['immunizations', patientUUID, status],
    queryFn: () => getPatientImmunizations(patientUUID, status),
    enabled: !!patientUUID,
  });

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.immunizations
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  return { data, isLoading, isError };
};
