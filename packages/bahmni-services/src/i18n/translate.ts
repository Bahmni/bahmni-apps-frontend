import { getI18n } from 'react-i18next';

/**
 * Translates a key outside React components (services, handlers, notifications).
 *
 * Resolves through the i18n instance the app initialised and `useTranslation` is
 * bound to. Do not use a bare `import i18next from 'i18next'` for this: bundlers
 * can include it as a separate copy that is never initialised, which returns empty
 * text. Falls back to the key itself when no instance has been set up, or when the
 * translation is missing or empty, so the user never sees a blank message.
 */
export const translate = (key: string): string => getI18n()?.t(key) || key;
