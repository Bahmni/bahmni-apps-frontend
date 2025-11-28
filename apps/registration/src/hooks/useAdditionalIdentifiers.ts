import { useMemo } from 'react';
import { useIdentifierTypes } from './useIdentifierTypes';
import { useRegistrationConfig } from './useRegistrationConfig';

export const useAdditionalIdentifiers = () => {
  const { registrationConfig } = useRegistrationConfig();
  const { data: identifierTypes, isLoading } = useIdentifierTypes();

  const isConfigEnabled = useMemo(
    () =>
      registrationConfig?.patientInformation
        ?.isExtraPatientIdentifiersSection ?? true,
    [registrationConfig],
  );

  const hasAdditionalIdentifiers = useMemo(() => {
    if (!identifierTypes) return false;
    return identifierTypes.some((type) => type.primary === false);
  }, [identifierTypes]);

  const shouldShowAdditionalIdentifiers =
    isConfigEnabled && hasAdditionalIdentifiers;

  return {
    shouldShowAdditionalIdentifiers,
    hasAdditionalIdentifiers,
    isConfigEnabled,
    identifierTypes,
    isLoading,
  };
};
