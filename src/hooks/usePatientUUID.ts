import { useParams } from 'react-router-dom';

/**
 * Hook to retrieve the patient UUID from the URL
 * @returns {string|null} The patient UUID or null if not found
 * @example
 * const patientUuid = usePatientUUID();
 */
export const usePatientUUID = (): string | null => {
  const params = useParams();
  return params.patientUuid || null;
};
