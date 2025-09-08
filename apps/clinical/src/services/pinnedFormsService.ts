import {
  get,
  post,
  getCurrentUser,
  USER_PINNED_PREFERENCE_URL,
} from '@bahmni-frontend/bahmni-services';
import { PINNED_FORMS_ERROR_MESSAGES } from '../constants/errors';
import { PINNED_FORMS_DELIMITER } from '../constants/forms';

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
    if (!user) {
      throw new Error(PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const userData = await get<UserData>(USER_PINNED_PREFERENCE_URL(user.uuid));
    const pinnedString = userData.userProperties?.pinnedObsTemplates ?? '';
    return pinnedString ? pinnedString.split(PINNED_FORMS_DELIMITER) : [];
  } catch (error) {
    if (error instanceof Error) {
      throw error.message;
    }

    throw PINNED_FORMS_ERROR_MESSAGES.LOAD_FAILED;
  }
};

/**
 * Save pinned observation form names to user preferences
 * @param formNames Array of form names to pin
 */
export const savePinnedForms = async (formNames: string[]): Promise<void> => {
  try {
    if (!Array.isArray(formNames)) {
      throw new Error(PINNED_FORMS_ERROR_MESSAGES.INVALID_DATA);
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error(PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const userData = await get<UserData>(USER_PINNED_PREFERENCE_URL(user.uuid));
    const updatedUserProperties: UserProperties = {
      ...userData.userProperties,
      pinnedObsTemplates: formNames.join(PINNED_FORMS_DELIMITER),
    };

    await post(USER_PINNED_PREFERENCE_URL(user.uuid), {
      userProperties: updatedUserProperties,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error.message;
    }

    throw PINNED_FORMS_ERROR_MESSAGES.SAVE_FAILED;
  }
};
