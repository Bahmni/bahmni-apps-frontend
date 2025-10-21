// Time picker validation patterns
export const TIME_PICKER_12H_PATTERN =
  '^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM|am|pm)$';
export const TIME_PICKER_24H_PATTERN = '^([01]?[0-9]|2[0-3]):[0-5][0-9]$';

// Time picker placeholders
export const TIME_PICKER_PLACEHOLDER_12H = 'hh:mm AM/PM';
export const TIME_PICKER_PLACEHOLDER_24H = 'HH:mm';

// Time picker max lengths
export const TIME_PICKER_MAX_LENGTH_12H = 8; // "12:59 PM"
export const TIME_PICKER_MAX_LENGTH_24H = 5; // "23:59"
