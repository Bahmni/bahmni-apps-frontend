import { get } from '../api';
import { SESSION_URL } from '../constants/app';
import { getFormattedError } from '../errorHandling';
import { UserPrivilege, SessionResponse } from './models';

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

export const hasPrivilege = (
  userPrivileges: UserPrivilege[] | null,
  requiredPrivilege: string | string[],
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  const requiredPrivileges = Array.isArray(requiredPrivilege)
    ? requiredPrivilege
    : [requiredPrivilege];

  return userPrivileges.some((privilege) =>
    requiredPrivileges.includes(privilege.name),
  );
};
