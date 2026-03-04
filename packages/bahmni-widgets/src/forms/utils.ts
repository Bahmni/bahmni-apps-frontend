import { FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL } from '@bahmni/services';
import { Bundle, Observation } from 'fhir/r4';
import { ExtractedObservation } from '../observations/models';
import { extractObservationsFromBundle } from '../observations/utils';

export interface FormFieldData {
  obs: ExtractedObservation;
  comment?: string;
  formFieldPath?: string;
}

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
 * Extract comment from FHIR Observation note field
 * @param observation - FHIR Observation resource
 * @returns comment string or undefined
 */
export const extractComment = (
  observation: Observation | undefined,
): string | undefined => {
  if (!observation) return undefined;
  return observation.note?.[0]?.text;
};

/**
 * Get FHIR Observation from bundle by observation ID
 * @param bundle - FHIR Bundle containing Observations
 * @param obsId - Observation ID to find
 * @returns FHIR Observation resource or undefined
 */
const getObservationById = (
  bundle: Bundle<Observation>,
  obsId: string,
): Observation | undefined => {
  return bundle.entry?.find((entry) => entry.resource?.id === obsId)
    ?.resource as Observation | undefined;
};

/**
 * Extract form field data (formFieldPath and comment) from a FHIR Observation
 * @param bundle - FHIR Bundle containing Observations
 * @param obsId - Observation ID to extract data for
 * @returns Object with formFieldPath and comment
 */
export const getFormFieldPathAndComment = (
  bundle: Bundle<Observation>,
  obsId: string,
): { formFieldPath?: string; comment?: string } => {
  const fhirObs = getObservationById(bundle, obsId);

  if (!fhirObs) return {};

  return {
    formFieldPath: extractFormFieldPath(fhirObs),
    comment: extractComment(fhirObs),
  };
};

/**
 * Filter observations by form name using formFieldPath
 * Observations without formFieldPath are included (assumed to belong to the form)
 * @param bundle - FHIR Bundle containing Observations
 * @param formName - Name of the form to filter by
 * @returns Array of FormFieldData with observations filtered by form name
 */
export const filterObservationsByFormName = (
  bundle: Bundle<Observation>,
  formName: string,
): FormFieldData[] => {
  if (!bundle?.entry || !formName) {
    return [];
  }

  const extractedResult = extractObservationsFromBundle(bundle);

  const allObservations: FormFieldData[] = [
    ...extractedResult.observations.map((obs) => {
      const { formFieldPath, comment } = getFormFieldPathAndComment(
        bundle,
        obs.id,
      );
      return { obs, formFieldPath, comment };
    }),

    ...extractedResult.groupedObservations.flatMap((group) => {
      const { formFieldPath } = getFormFieldPathAndComment(bundle, group.id);
      return (group.members ?? []).map((child) => {
        const { comment } = getFormFieldPathAndComment(bundle, child.id);
        return { obs: child, formFieldPath, comment };
      });
    }),
  ];

  // Filter by form name using formFieldPath
  return allObservations.filter(
    ({ formFieldPath }) => !formFieldPath || formFieldPath.includes(formName),
  );
};
