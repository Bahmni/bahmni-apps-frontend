export const DEFAULT_FORM_TRANSLATION_KEYS = [
  'DEFAULT_FORM_HISTORY_AND_EXAMINATION',
  'DEFAULT_FORM_VITALS',
];

export const DEFAULT_FORM_API_NAMES = ['History and Examination', 'Vitals'];

export const PINNED_FORMS_DELIMITER = '###';

export const FORM_CONTROL_TYPE_OBS_GROUP = 'obsGroupControl';
export const FORM_CONTROL_TYPE_OBS = 'obsControl';
export const FORM_CONTROL_TYPE_MULTISELECT = 'multiselect';

/**
 * Validation states for observation forms.
 * These values are also used to match error messages from form2-controls library.
 */
export const VALIDATION_STATE_EMPTY = 'empty';
export const VALIDATION_STATE_MANDATORY = 'mandatory';
export const VALIDATION_STATE_INVALID = 'invalid';
export const VALIDATION_STATE_SCRIPT_ERROR = 'script_error';
