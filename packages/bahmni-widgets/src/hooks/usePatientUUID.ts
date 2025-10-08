import { useParams } from 'react-router-dom';

// TODO: Handle No Patient UUID By Redirecting User
/**
 * Hook to retrieve the patient UUID from the URL
 * @returns {string|null} The patient UUID or null if not found
 */
export const usePatientUUID = (): string | null => {
  const params = useParams();
  if (!params.patientUuid || params.patientUuid === '') {
    return null;
  }
  return params.patientUuid;
};
