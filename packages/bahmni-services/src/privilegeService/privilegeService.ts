import { get } from '../api';
import { SESSION_URL } from '../constants/app';
import { getFormattedError } from '../errorHandling';
import { UserPrivilege, SessionResponse } from './models';

/**
 * Fetches current user privileges from session API
 * @returns Promise that resolves to array of user privileges or null if failed
 * @throws Error if fetch fails
 */
export const getCurrentUserPrivileges = async (): Promise<
  UserPrivilege[] | null
> => {
  try {
    const session = await get<SessionResponse>(SESSION_URL);

    return session.user.privileges;
  } catch (error) {
    const { message } = getFormattedError(error);
    throw new Error(message);
  }
};

/**
 * Check if user has a specific privilege or any of the given privileges
 * @param userPrivileges - Array of user privileges from session API
 * @param requiredPrivilege - Name of the privilege or array of privilege names to check
 * @returns true if user has any of the required privileges, false otherwise
 */
export const hasPrivilege = (
  userPrivileges: UserPrivilege[] | null,
  requiredPrivilege: string | string[] | undefined,
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  if (!requiredPrivilege || requiredPrivilege.length === 0) {
    return true;
  }

  const requiredPrivileges = Array.isArray(requiredPrivilege)
    ? requiredPrivilege
    : [requiredPrivilege];

  return userPrivileges.some((userPrivilege) =>
    requiredPrivileges.includes(userPrivilege.name),
  );
};
