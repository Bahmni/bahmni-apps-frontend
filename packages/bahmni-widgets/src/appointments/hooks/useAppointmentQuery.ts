import { useTranslation } from '@bahmni/services';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type { Appointment as FhirAppointment, Bundle } from 'fhir/r4';
import { useEffect } from 'react';
import { useNotification } from '../../notification';

interface UseAppointmentQueryOptions {
  queryKey: string[];
  queryFn: () => Promise<Bundle<FhirAppointment>>;
  patientUUID: string;
}

export const useAppointmentQuery = ({
  queryKey,
  queryFn,
  patientUUID,
}: UseAppointmentQueryOptions): UseQueryResult<Bundle<FhirAppointment>> => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const result = useQuery({
    queryKey,
    enabled: !!patientUUID,
    queryFn,
  });

  useEffect(() => {
    if (result.isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: result.error?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [result.isError, result.error, addNotification, t]);

  return result;
};
