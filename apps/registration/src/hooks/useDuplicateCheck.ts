import { hasPrivilege, matchFhirPatient } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import type { Patient } from 'fhir/r4';
import { useCallback, useMemo } from 'react';
import { useRegistrationConfig } from '../providers/registrationConfig';

export const useDuplicateCheck = () => {
  const { registrationConfig } = useRegistrationConfig();
  const { userPrivileges, isLoading: privilegesLoading } = useUserPrivilege();

  const duplicateDetection = registrationConfig?.duplicateDetection;

  const isEnabled = useMemo(() => {
    if (!duplicateDetection?.match || !duplicateDetection.featureURL) {
      return false;
    }
    const required = duplicateDetection.requiredPrivileges;
    if (!required?.length) return true;
    return !privilegesLoading && hasPrivilege(userPrivileges, required);
  }, [duplicateDetection, userPrivileges, privilegesLoading]);

  const findDuplicates = useCallback(async (patient: Patient) => {
    const bundle = await matchFhirPatient(patient);
    return (bundle.entry ?? [])
      .map((entry) => entry.resource)
      .filter(
        (resource): resource is Patient =>
          resource?.resourceType === 'Patient' && resource.id !== patient.id,
      );
  }, []);

  return {
    isEnabled,
    featureURL: duplicateDetection?.featureURL,
    findDuplicates,
  };
};
