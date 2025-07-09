import { useTranslation } from 'react-i18next';

export const useRegistrationTranslation = () => {
  const { t } = useTranslation('registration');
  return { t };
};
