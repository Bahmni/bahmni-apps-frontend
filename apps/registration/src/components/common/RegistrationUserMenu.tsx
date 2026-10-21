import { getUserLoginLocation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';

export const RegistrationUserMenu = () => {
  let locationName: string | undefined;

  try {
    locationName = getUserLoginLocation()?.name;
  } catch {
    // getUserLoginLocation throws an error.
    // Catch it and pass undefined so the menu renders normally without the row.
    locationName = undefined;
  }

  return <UserGlobalAction locationName={locationName} />;
};
