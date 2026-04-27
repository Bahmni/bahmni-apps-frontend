import { FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL } from '@bahmni/services';
import { Observation } from 'fhir/r4';

/**
 * Extract formFieldPath from FHIR Observation extension
 * @param observation - FHIR Observation resource
 * @returns formFieldPath string or undefined
 */
export const extractFormFieldPath = (
  observation: Observation | undefined,
): string | undefined => {
  if (!observation) return undefined;

  const formPathExt = observation.extension?.find(
    (ext) => ext.url === FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
  );

  return formPathExt?.valueString;
};
