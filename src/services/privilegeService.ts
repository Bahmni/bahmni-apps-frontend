import { USER_PRIVILEGES_URL } from '@constants/app';
import { getFormattedError } from '@utils/common';
import { UserPrivilege } from '@components/clinical/forms/observationForms/utils/privilegeUtils';
import { get } from './api';

/**
 * Fetches current user privileges from whoami API
 * @returns Promise that resolves to array of user privileges or null if failed
 * @throws Error if fetch fails
 */
export const getCurrentUserPrivileges = async (): Promise<
  UserPrivilege[] | null
> => {
  try {
    const privileges = await get<UserPrivilege[]>(USER_PRIVILEGES_URL);
    return privileges;
  } catch (error) {
    const { message } = getFormattedError(error);
    throw new Error(message);
  }
};

/**
 * Check if user has a specific privilege by name
 * @param userPrivileges - Array of user privileges from whoami API
 * @param privilegeName - Name of the privilege to check
 * @returns true if user has the privilege, false otherwise
 */
export const hasPrivilege = (
  userPrivileges: UserPrivilege[] | null,
  privilegeName: string,
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  return userPrivileges.some((privilege) => privilege.name === privilegeName);
};
