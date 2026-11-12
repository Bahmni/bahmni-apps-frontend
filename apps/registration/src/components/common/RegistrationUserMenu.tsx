import { getUserLoginLocation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import { useMemo } from 'react';

export const RegistrationUserMenu = () => {
  const locationName = useMemo(() => {
    try {
      return getUserLoginLocation().name.trim();
    } catch (error) {
      // getUserLoginLocation throws error when the location cookie is missing.
      // eslint-disable-next-line no-console
      console.warn('Failed to read user login location:', error);
      return undefined;
    }
  }, []);
  return <UserGlobalAction locationName={locationName} />;
};
