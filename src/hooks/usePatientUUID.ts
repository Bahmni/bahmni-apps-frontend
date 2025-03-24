import { useLocation } from 'react-router-dom';
import { extractFirstUuidFromPath } from '@utils/common';

/**
 * Custom hook to extract the first UUID from the current URL
 *
 * @returns {string|null} The extracted UUID or null if not found
 */
export const usePatientUUID = (): string | null => {
  const location = useLocation();
  return extractFirstUuidFromPath(location.pathname);
};
