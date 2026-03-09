import type { Appointment as FhirAppointment, Bundle } from 'fhir/r4';
import { useMemo } from 'react';
import {
  FormattedAppointment,
  transformFhirAppointmentToFormatted,
} from '../utils';

interface UseFormattedAppointmentsOptions {
  data: Bundle<FhirAppointment> | undefined;
  idPrefix: string;
}

export const useFormattedAppointments = ({
  data,
  idPrefix,
}: UseFormattedAppointmentsOptions): FormattedAppointment[] => {
  return useMemo(() => {
    if (!data?.entry) return [];

    const fhirAppointments = data.entry
      .map((entry) => entry.resource)
      .filter((resource) => resource !== undefined);

    return fhirAppointments
      .map((appt, index: number) => {
        if (!appt) return undefined;
        const formatted = transformFhirAppointmentToFormatted(appt);
        return {
          ...formatted,
          uuid: formatted.uuid || `${idPrefix}-${index}`,
        };
      })
      .filter((item): item is FormattedAppointment => item !== undefined);
  }, [data, idPrefix]);
};
