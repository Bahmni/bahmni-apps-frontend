import { OBSERVATION_DATE_TIME_FORMAT } from '../date/constants';
import { formatDate } from '../date/date';
import { FHIRObservationBundle, FormattedObservation } from './models';

/**
 * Extract value and unit from FHIR observation
 */
export const extractObservationValue = (
  observation: FHIRObservationBundle['entry'][0]['resource'],
): { value: string; unit?: string } => {
  if (observation.resourceType === 'Encounter') {
    return { value: '' };
  }

  if (observation.valueString) {
    return { value: observation.valueString };
  }

  if (observation.valueQuantity) {
    return {
      value: observation.valueQuantity.value.toString(),
      unit: observation.valueQuantity.unit,
    };
  }

  if (observation.valueCodeableConcept) {
    return { value: observation.valueCodeableConcept.text };
  }

  return { value: '' };
};

/**
 * Format FHIR observation bundle into display format with parent-child relationships
 * @param bundle - FHIR observation bundle
 * @param t - Translation function for date formatting
 * @returns Array of formatted observations with nested children
 */
export function formatObservations(
  bundle: FHIRObservationBundle,
  t: (key: string) => string,
): FormattedObservation[] {
  if (!bundle.entry || bundle.entry.length === 0) {
    return [];
  }

  // Build encounter map for practitioner lookup
  const encounterMap = new Map<string, string>();
  bundle.entry.forEach((entry) => {
    if (entry.resource.resourceType === 'Encounter') {
      const practitionerName =
        entry.resource.participant?.[0]?.individual?.display;
      if (practitionerName) {
        encounterMap.set(entry.resource.id, practitionerName);
      }
    }
  });

  const observationMap = new Map<string, FormattedObservation>();

  bundle.entry.forEach((entry) => {
    if (entry.resource.resourceType !== 'Observation') return;

    const obs = entry.resource;
    const formattedDate = formatDate(
      obs.effectiveDateTime,
      t,
      OBSERVATION_DATE_TIME_FORMAT,
    ).formattedResult;

    // Extract encounter ID and get practitioner name
    const encounterId = obs.encounter?.reference.split('/')[1];
    const recordedBy = encounterId ? encounterMap.get(encounterId) : undefined;

    const extracted = obs.hasMember
      ? { value: '', unit: undefined }
      : extractObservationValue(obs);

    observationMap.set(obs.id, {
      id: obs.id,
      conceptName: obs.code.text,
      value: extracted.value,
      unit: extracted.unit,
      date: formattedDate,
      isParent: !!obs.hasMember,
      recordedBy,
      children: [],
    });
  });

  const childIds = new Set<string>();

  bundle.entry.forEach((entry) => {
    if (entry.resource.resourceType !== 'Observation') return;

    const obs = entry.resource;
    if (obs.hasMember) {
      obs.hasMember.forEach((member) => {
        const childId = member.reference.split('/')[1];
        const child = observationMap.get(childId);
        const parent = observationMap.get(obs.id);

        if (child && parent) {
          parent.children.push({ ...child, isParent: false, children: [] });
          childIds.add(childId);
        }
      });
    }
  });

  return Array.from(observationMap.values()).filter(
    (obs) => !childIds.has(obs.id),
  );
}
