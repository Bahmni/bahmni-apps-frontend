import { FormMetadata, ObservationDataInFormControls, ConceptValue } from './models';

export type { ObservationDataInFormControls, ConceptValue };

export interface FormControlData {
  id: string;
  conceptUuid: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'select'
    | 'multiselect'
    | 'section'
    | 'obsControl';
  value: string | number | boolean | Date | ConceptValue | null;
  label?: string;
  units?: string;
  groupMembers?: FormControlData[];
}

export interface FormData {
  controls: FormControlData[];
  metadata?: Record<string, unknown>;
}

/**
 * Transform form control value based on its type
 */
function transformControlValue(
  control: FormControlData,
): string | number | boolean | ConceptValue {
  if (control.value === null || control.value === undefined) {
    throw new Error(`Control ${control.id} has no value`);
  }

  // Handle date/datetime - convert to ISO string
  if (control.value instanceof Date) {
    return control.value.toISOString();
  }

  // Handle coded values (select/multiselect)
  if (
    (control.type === 'select' || control.type === 'multiselect') &&
    typeof control.value === 'object'
  ) {
    return control.value as ConceptValue;
  }

  // Handle primitive types
  return control.value as string | number | boolean;
}

/**
 * Transform group members (nested controls)
 */
function transformGroupMembers(
  groupMembers: FormControlData[],
): ObservationDataInFormControls[] {
  return groupMembers
    .filter((member) => member.value !== null && member.value !== undefined)
    .map((member) => ({
      concept: { uuid: member.conceptUuid },
      value: transformControlValue(member),
      obsDatetime: new Date().toISOString(),
      formFieldPath: member.id,
      // Recursively handle nested groups
      groupMembers: member.groupMembers
        ? transformGroupMembers(member.groupMembers)
        : undefined,
    }));
}

/**
 * Transform form2-controls data to OpenMRS observation format
 *
 * @param formData - Data from form2-controls Container.onValueUpdated
 * @param metadata - Form metadata (optional, for validation context)
 * @returns Array of observation data ready for consultation bundle
 */
export function transformFormDataToObservations(
  formData: FormData,
  metadata?: FormMetadata,
): ObservationDataInFormControls[] {
  if (!formData.controls || formData.controls.length === 0) {
    return [];
  }

  const observations: ObservationDataInFormControls[] = [];
  const timestamp = new Date().toISOString();

  formData.controls.forEach((control) => {
    // Skip controls without values
    if (control.value === null || control.value === undefined) {
      return;
    }

    // Skip section headers (they don't have concepts)
    if (control.type === 'section' && !control.conceptUuid) {
      return;
    }

    try {
      const observation: ObservationDataInFormControls = {
        concept: { uuid: control.conceptUuid },
        value: transformControlValue(control),
        obsDatetime: timestamp,
        formFieldPath: control.id,
      };

      // Handle group members (complex controls)
      if (control.groupMembers && control.groupMembers.length > 0) {
        observation.groupMembers = transformGroupMembers(control.groupMembers);
      }

      observations.push(observation);
    } catch (error) {
      // Continue processing other controls
    }
  });

  return observations;
}

export function transformObservationsToFormData(
  observations: ObservationDataInFormControls[],
  formMetadata: FormMetadata,
): FormData {
  return {
    controls: [],
    metadata: {},
  };
}
