import { formatDate } from '../date/date';
import { FHIRObservationBundle, FormattedObservation } from './models';

/**
 * Extract value from FHIR observation
 */
export const extractObservationValue = (
  observation: FHIRObservationBundle['entry'][0]['resource'],
): string => {
  if (observation.valueString) return observation.valueString;
  if (observation.valueQuantity)
    return observation.valueQuantity.value.toString();
  if (observation.valueCodeableConcept)
    return observation.valueCodeableConcept.text;
  return '';
};

/**
 * Format FHIR observation bundle into display format with parent-child relationships
 * @param bundle - FHIR observation bundle
 * @param t - Translation function
 * @returns Array of formatted observations with nested children
 */
export function formatObservations(
  bundle: FHIRObservationBundle,
  t: (key: string) => string,
): FormattedObservation[] {
  if (!bundle.entry || bundle.entry.length === 0) {
    return [];
  }

  // Create a map of all observations by ID
  const observationMap = new Map<string, FormattedObservation>();

  bundle.entry.forEach((entry) => {
    const obs = entry.resource;
    const dateResult = formatDate(obs.effectiveDateTime, t);

    observationMap.set(obs.id, {
      id: obs.id,
      conceptName: obs.code.text,
      value: extractObservationValue(obs),
      date: dateResult.formattedResult || obs.effectiveDateTime,
      isParent: !!obs.hasMember,
      children: [],
    });
  });

  // Link children to parents
  bundle.entry.forEach((entry) => {
    const obs = entry.resource;
    if (obs.hasMember) {
      obs.hasMember.forEach((member) => {
        const childId = member.reference.split('/')[1];
        const child = observationMap.get(childId);
        const parent = observationMap.get(obs.id);
        if (child && parent) {
          parent.children.push(child);
        }
      });
    }
  });

  // Return only parent observations (children are nested)
  return Array.from(observationMap.values()).filter(
    (obs) =>
      obs.isParent ||
      !Array.from(observationMap.values()).some((parent) =>
        parent.children.some((child) => child.id === obs.id),
      ),
  );
}
