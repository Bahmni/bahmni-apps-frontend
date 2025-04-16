// Import the actual i18n instance from our test setup
import i18n from '../setupTests.i18n';

// Mock for the useTranslation hook
export const useTranslation = () => {
  return {
    t: (key: string) => {
      // Use the actual i18n instance to translate
      return i18n.t(key);
    },
    i18n: i18n,
  };
};
