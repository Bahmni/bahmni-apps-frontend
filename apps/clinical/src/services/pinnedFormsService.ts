import {
  get,
  post,
  USER_PINNED_PREFERENCE_URL,
  getFormattedError,
} from '@bahmni/services';
import { PINNED_FORMS_ERROR_MESSAGES } from '../constants/errors';
import { PINNED_FORMS_DELIMITER } from '../constants/forms';
import { UserData } from '../models/observationForms';

/**
 * Load pinned observation form names from user preferences
 * @param userUuid - The UUID of the current user
 * @returns Array of pinned form names
 */
export const loadPinnedForms = async (userUuid: string): Promise<string[]> => {
  try {
    if (!userUuid) {
      throw new Error(PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const userData = await get<UserData>(USER_PINNED_PREFERENCE_URL(userUuid));

    // Validate user data structure
    if (!userData || typeof userData !== 'object') {
      return [];
    }

    const pinnedString = userData.userProperties?.pinnedObsTemplates ?? '';

    // Additional validation for malformed data
    if (typeof pinnedString !== 'string') {
      return [];
    }

    return pinnedString
      ? pinnedString.split(PINNED_FORMS_DELIMITER).filter(Boolean)
      : [];
  } catch (error) {
    const formattedError = getFormattedError(error);
    throw new Error(formattedError.message ?? 'Unknown error');
  }
};

/**
 * Save pinned observation form names to user preferences
 * @param userUuid - The UUID of the current user
 * @param formNames Array of form names to pin
 */
export const savePinnedForms = async (
  userUuid: string,
  formNames: string[],
): Promise<void> => {
  try {
    if (!userUuid) {
      throw new Error(PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!Array.isArray(formNames)) {
      throw new Error(PINNED_FORMS_ERROR_MESSAGES.INVALID_DATA);
    }

    // Validate form names are strings
    const validFormNames = formNames.filter(
      (name) => typeof name === 'string' && name.trim().length > 0,
    );

    // Directly POST the pinned forms without fetching existing user data
    // The backend will merge with existing userProperties
    await post(USER_PINNED_PREFERENCE_URL(userUuid), {
      userProperties: {
        pinnedObsTemplates: validFormNames.join(PINNED_FORMS_DELIMITER),
      },
    });
  } catch (error) {
    const formattedError = getFormattedError(error);
    throw new Error(formattedError.message ?? 'Unknown error');
  }
};
