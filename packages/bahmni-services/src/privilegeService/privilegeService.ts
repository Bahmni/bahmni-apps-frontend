import { USER_PRIVILEGES_URL } from '../constants/app';
import { getFormattedError } from '../errorHandling';
import { UserPrivilege } from '../observationFormsService';
import { get } from '../api';

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
