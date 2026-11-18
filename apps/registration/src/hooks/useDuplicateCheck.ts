import {
  getAllowedDomains,
  hasPrivilege,
  matchFhirPatient,
} from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Patient } from 'fhir/r4';
import { useCallback, useMemo } from 'react';
import { useRegistrationConfig } from '../providers/registrationConfig';

const getOrigin = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).origin;
  } catch {
    return undefined;
  }
};

const isTrustedOrigin = (origin: string, allowedDomains: string[] = []) => {
  if (origin === window.location.origin) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol === window.location.protocol && allowedDomains.includes(hostname)
    );
  } catch {
    return false;
  }
};

export const useDuplicateCheck = () => {
  const { registrationConfig } = useRegistrationConfig();
  const { userPrivileges, isLoading: privilegesLoading } = useUserPrivilege();

  const duplicateDetection = registrationConfig?.duplicateDetection;
  const configuredURL = duplicateDetection?.featureURL;
  const featureOrigin = getOrigin(configuredURL);

  const { data: allowedDomains } = useQuery({
    queryKey: ['allowedDomains'],
    queryFn: getAllowedDomains,
    enabled: !!featureOrigin && featureOrigin !== window.location.origin,
  });

  const isTrusted = useCallback(
    (origin: string) => isTrustedOrigin(origin, allowedDomains),
    [allowedDomains],
  );

  const featureURL =
    featureOrigin && isTrusted(featureOrigin) ? configuredURL : undefined;

  const isEnabled = useMemo(() => {
    if (!duplicateDetection?.match || !featureURL) {
      return false;
    }
    const required = duplicateDetection.requiredPrivileges;
    if (!required?.length) return true;
    return !privilegesLoading && hasPrivilege(userPrivileges, required);
  }, [duplicateDetection, featureURL, userPrivileges, privilegesLoading]);

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
    featureURL,
    isTrustedOrigin: isTrusted,
    findDuplicates,
  };
};
