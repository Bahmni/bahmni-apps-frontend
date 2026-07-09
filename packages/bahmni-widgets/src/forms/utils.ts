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

/**
 * Extract the form name from an observation's form-namespace-path extension.
 *
 * The path value is `{namespace}^{formName}.{version}/{fieldPath}`
 * (e.g. `Bahmni^Vitals.1/10-0`) or `{formName}.{version}/{fieldPath}`
 * (e.g. `Vitals.1/1-0`). Returns the bare form name (e.g. `Vitals`), stripping
 * a single trailing `.{version}` segment (OpenMRS form versions are integers),
 * or undefined if the value is absent/malformed.
 */
export const extractFormName = (
  observation: Observation | undefined,
): string | undefined => {
  const valueString = extractFormFieldPath(observation);
  if (!valueString) return undefined;

  const name = valueString
    .split('/')[0]
    .split('^')
    .pop()
    ?.replace(/\.\d+$/, '');

  if (!name) return undefined;
  return name;
};
