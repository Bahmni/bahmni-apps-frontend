import { OBSERVATION_DATE_TIME_FORMAT } from '../date/constants';
import { formatDate } from '../date/date';
import { ObservationForm } from '../observationFormsService/models';
import { FHIRObservationBundle, ObsGroup } from './models';

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

  if (observation.valueDateTime) {
    // Format the date to a readable format
    const date = new Date(observation.valueDateTime);
    return { value: date.toLocaleDateString() };
  }

  return { value: '' };
};

/**
 * Extract form name from FHIR extension path and return translated name
 * Path format: "Bahmni^History and Examination.1/25-0"
 * Returns translated form name if available, otherwise the English form name
 */
const extractFormName = (
  extensions?: Array<{ url: string; valueString: string }>,
  forms?: ObservationForm[],
): string => {
  if (!extensions) return 'General Observations';

  const formExtension = extensions.find(
    (ext) =>
      ext.url === 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
  );

  if (!formExtension?.valueString) return 'General Observations';

  // Extract form name from path (e.g., "History and Examination" from "Bahmni^History and Examination.1/25-0")
  const pathParts = formExtension.valueString.split('^');
  if (pathParts.length < 2) return 'General Observations';

  const englishFormName = pathParts[1].split('.')[0] || 'General Observations';

  // Find matching form and return its translated name
  // ObservationForm.name is already translated by fetchObservationForms()
  if (forms && forms.length > 0) {
    const translatedForm = forms.find((form) => {
      const translations = JSON.parse(form.nameTranslation);
      return translations.some(
        (t: { display: string }) => t.display === englishFormName,
      );
    });

    if (translatedForm) {
      return translatedForm.name;
    }
  }

  return englishFormName;
};

/**
 * Format FHIR observation bundle into display format with parent-child relationships
 * @param bundle - FHIR observation bundle
 * @param t - Translation function for date formatting
 * @param forms - Optional array of form data for translations
 * @returns Array of formatted observations with nested children
 */
export function formatObservations(
  bundle: FHIRObservationBundle,
  t: (key: string) => string,
  forms?: ObservationForm[],
): ObsGroup[] {
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

  const observationMap = new Map<string, ObsGroup>();

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

    // Extract form name from extensions with forms data
    const formName = extractFormName(obs.extension, forms);

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
      formName,
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
