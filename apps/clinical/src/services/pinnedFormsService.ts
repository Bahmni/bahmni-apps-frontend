import {
  get,
  post,
  getCurrentUser,
  USER_PINNED_PREFERENCE_URL,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';

interface UserProperties {
  defaultLocale?: string;
  favouriteObsTemplates?: string;
  pinnedObsTemplates?: string;
  favouriteWards?: string;
  loginAttempts?: string;
  recentlyViewedPatients?: string;
  [key: string]: unknown;
}

interface UserData {
  uuid: string;
  username: string;
  userProperties?: UserProperties;
  [key: string]: unknown;
}

/**
 * Load pinned observation form names from user preferences
 * @returns Array of pinned form names
 */
export const loadPinnedForms = async (): Promise<string[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    const userData = await get<UserData>(USER_PINNED_PREFERENCE_URL(user.uuid));
    const pinnedString = userData.userProperties?.pinnedObsTemplates ?? '';
    return pinnedString ? pinnedString.split('###') : [];
  } catch (error) {
    const formattedError = getFormattedError(error);
    throw formattedError.message;
  }
};

/**
 * Save pinned observation form names to user preferences
 * @param formNames Array of form names to pin
 */
export const savePinnedForms = async (formNames: string[]): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    const userData = await get<UserData>(USER_PINNED_PREFERENCE_URL(user.uuid));
    const updatedUserProperties: UserProperties = {
      ...userData.userProperties,
      pinnedObsTemplates: formNames.join('###'),
    };

    await post(USER_PINNED_PREFERENCE_URL(user.uuid), {
      userProperties: updatedUserProperties,
    });
  } catch (error) {
    const formattedError = getFormattedError(error);
    throw formattedError.message;
  }
};
