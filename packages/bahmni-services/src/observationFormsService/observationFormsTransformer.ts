import { DATETIME_REGEX_PATTERN } from '../constants/fhir';
import { DEFAULT_FORM_NAMESPACE } from './constants';
import {
  FormMetadata,
  Form2Observation,
  ConceptValue,
  ComplexValue,
} from './models';

export type { Form2Observation, ConceptValue, ComplexValue };

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
  value:
    | string
    | number
    | boolean
    | Date
    | ConceptValue
    | ConceptValue[]
    | ComplexValue
    | null;
  label?: string;
  units?: string;
  interpretation?: string;
  comment?: string;
  groupMembers?: FormControlData[];
}

export interface FormData {
  controls: FormControlData[];
  metadata?: Record<string, unknown>;
}

function transformControlValue(
  control: FormControlData,
): string | number | boolean | ConceptValue | ComplexValue {
  const { value } = control;

  if (value === null || typeof value !== 'object') {
    return value as string | number | boolean;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (control.type === 'select' && !Array.isArray(value) && 'uuid' in value) {
    return value as ConceptValue;
  }

  if (!Array.isArray(value) && 'url' in value) {
    return (value as ComplexValue).url;
  }

  return value as ConceptValue | string | number | boolean;
}

function transformGroupMembers(
  groupMembers: FormControlData[],
  metadata: FormMetadata,
): Form2Observation[] {
  return groupMembers.map((member) => {
    const datatype = findConceptDatatype(metadata, member.conceptUuid);
    const observation: Form2Observation = {
      concept: { uuid: member.conceptUuid, datatype },
      value: transformControlValue(member),
      obsDatetime: new Date().toISOString(),
      formNamespace: DEFAULT_FORM_NAMESPACE,
      formFieldPath: member.id,
      groupMembers: member.groupMembers
        ? transformGroupMembers(member.groupMembers, metadata)
        : undefined,
    };

    if (member.interpretation) {
      observation.interpretation = member.interpretation;
    }

    if (member.comment) {
      observation.comment = member.comment;
    }

    return observation;
  });
}

// Helper function to find concept datatype from metadata schema
function findConceptDatatype(
  metadata: FormMetadata,
  conceptUuid: string,
): string | undefined {
  const schema = metadata.schema as Record<string, unknown>;
  if (!schema?.controls || !Array.isArray(schema.controls)) {
    return undefined;
  }

  const findInControls = (controls: unknown[]): string | undefined => {
    for (const control of controls) {
      if (
        typeof control === 'object' &&
        control !== null &&
        'concept' in control
      ) {
        const concept = (control as Record<string, unknown>).concept;
        if (
          typeof concept === 'object' &&
          concept !== null &&
          'uuid' in concept &&
          concept.uuid === conceptUuid &&
          'datatype' in concept
        ) {
          return concept.datatype as string;
        }
      }
      if (
        typeof control === 'object' &&
        control !== null &&
        'controls' in control
      ) {
        const nestedControls = (control as Record<string, unknown>).controls;
        if (Array.isArray(nestedControls)) {
          const found = findInControls(nestedControls);
          if (found) return found;
        }
      }
    }
    return undefined;
  };

  return findInControls(schema.controls as unknown[]);
}

export function transformFormDataToObservations(
  formData: FormData,
  metadata: FormMetadata,
): Form2Observation[] {
  if (!formData.controls || formData.controls.length === 0) {
    return [];
  }

  const observations: Form2Observation[] = [];
  const timestamp = new Date().toISOString();

  formData.controls.forEach((control) => {
    if (control.type === 'section' && !control.conceptUuid) {
      return;
    }

    const datatype = findConceptDatatype(metadata, control.conceptUuid);

    if (control.groupMembers?.length) {
      const groupObservation: Form2Observation = {
        concept: { uuid: control.conceptUuid, datatype },
        value: null,
        obsDatetime: timestamp,
        formNamespace: DEFAULT_FORM_NAMESPACE,
        formFieldPath: control.id,
        groupMembers: transformGroupMembers(control.groupMembers, metadata),
      };

      if (control.comment) {
        groupObservation.comment = control.comment;
      }

      observations.push(groupObservation);
      return;
    }

    if (control.value === null || control.value === undefined) {
      return;
    }

    if (control.type === 'multiselect' && Array.isArray(control.value)) {
      control.value.forEach((selectedValue) => {
        const observation: Form2Observation = {
          concept: { uuid: control.conceptUuid, datatype },
          value: selectedValue,
          obsDatetime: timestamp,
          formNamespace: DEFAULT_FORM_NAMESPACE,
          formFieldPath: control.id,
        };

        if (control.interpretation) {
          observation.interpretation = control.interpretation;
        }

        if (control.comment) {
          observation.comment = control.comment;
        }

        observations.push(observation);
      });
      return;
    }

    const observation: Form2Observation = {
      concept: { uuid: control.conceptUuid, datatype },
      value: transformControlValue(control),
      obsDatetime: timestamp,
      formNamespace: DEFAULT_FORM_NAMESPACE,
      formFieldPath: control.id,
    };

    if (control.interpretation) {
      observation.interpretation = control.interpretation;
    }

    if (control.comment) {
      observation.comment = control.comment;
    }

    observations.push(observation);
  });

  return observations;
}

export function transformObservationsToFormData(
  observations: Form2Observation[],
  formMetadata: FormMetadata,
): FormData {
  if (!observations || observations.length === 0) {
    return {
      controls: [],
      metadata: {},
    };
  }

  const controlsMap = new Map<string, FormControlData>();

  observations.forEach((obs) => {
    const fieldPath = obs.formFieldPath ?? obs.concept.uuid;

    if (controlsMap.has(fieldPath)) {
      const existingControl = controlsMap.get(fieldPath)!;

      if (!Array.isArray(existingControl.value)) {
        existingControl.value = [existingControl.value as ConceptValue];
      }

      if (typeof obs.value === 'object' && !Array.isArray(obs.value)) {
        (existingControl.value as ConceptValue[]).push(
          obs.value as ConceptValue,
        );
      }

      existingControl.type = 'multiselect';
    } else {
      let controlValue: string | number | boolean | Date | ConceptValue | null =
        obs.value as string | number | boolean | Date | ConceptValue | null;

      if (
        typeof obs.value === 'string' &&
        DATETIME_REGEX_PATTERN.test(obs.value)
      ) {
        const parsedDate = new Date(obs.value);
        if (!isNaN(parsedDate.getTime())) {
          controlValue = parsedDate;
        }
      }

      const control: FormControlData = {
        id: fieldPath,
        conceptUuid: obs.concept.uuid,
        type: 'obsControl',
        value: controlValue,
      };

      if (obs.interpretation) {
        control.interpretation = obs.interpretation;
      }

      if (obs.comment) {
        control.comment = obs.comment;
      }

      controlsMap.set(fieldPath, control);
    }
  });

  return {
    controls: Array.from(controlsMap.values()),
    metadata: { formMetadata },
  };
}

/** Coerces a raw CarbonContainer field value to the typed Form2Observation value. */
function getObsValue(
  value: unknown,
): string | number | boolean | ConceptValue | ComplexValue | null {
  if (value == null) return null;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'object') return value as ConceptValue | ComplexValue;
  return null;
}

/**
 * Transforms raw observations from Container.getValue() to Form2Observation format
 * This ensures comment, interpretation, and other fields are properly included
 */
export function transformContainerObservationsToForm2Observations(
  containerObservations: Record<string, unknown>[],
): Form2Observation[] {
  const transform = (obs: Record<string, unknown>): Form2Observation => {
    const concept = obs.concept as Record<string, unknown> | string | undefined;
    const conceptUuid: string =
      typeof concept === 'object' && concept !== null && 'uuid' in concept
        ? (concept.uuid as string)
        : (concept as string);
    const conceptDatatype: string | undefined =
      typeof concept === 'object' && concept !== null && 'datatype' in concept
        ? (concept.datatype as string | undefined)
        : undefined;

    const observation: Form2Observation = {
      concept: {
        uuid: conceptUuid,
        datatype: conceptDatatype,
      },
      value: getObsValue(obs.value),
      obsDatetime:
        typeof obs.observationDateTime === 'string'
          ? obs.observationDateTime
          : new Date().toISOString(),
      formNamespace:
        typeof obs.formNamespace === 'string' ? obs.formNamespace : 'Bahmni',
      formFieldPath:
        typeof obs.formFieldPath === 'string' ? obs.formFieldPath : undefined,
    };

    // Preserve uuid, voided and status so the bundle builder can emit the
    // correct HTTP verb and status value for each observation.
    // status is required on PUT/POST-with-uuid by OpenMRS and must echo back
    // exactly what is stored ("final" on first edit, "amended" on subsequent edits).
    if (typeof obs.uuid === 'string') observation.uuid = obs.uuid;
    if (obs.voided === true) observation.voided = true;
    if (typeof obs.status === 'string') observation.status = obs.status;

    if (typeof obs.comment === 'string') {
      observation.comment = obs.comment;
    }

    if (typeof obs.interpretation === 'string') {
      observation.interpretation = obs.interpretation;
    }

    if (obs.groupMembers && Array.isArray(obs.groupMembers)) {
      // Include ALL group members (including voided ones with uuid) so the
      // bundle builder can emit DELETE entries for cleared children.
      observation.groupMembers = (
        obs.groupMembers as Record<string, unknown>[]
      ).map(transform);
    }

    return observation;
  };

  const nonVoidedObservations =
    containerObservations?.filter((obs) => {
      if (obs.uuid && obs.voided) {
        return true;
      }
      if (!obs.uuid && obs.voided) {
        return false;
      }

      if (
        obs.value &&
        typeof obs.value === 'string' &&
        obs.value.endsWith('voided')
      ) {
        return false;
      }

      return true;
    }) ?? [];

  return nonVoidedObservations.map(transform);
}

/**
 * Converts Immutable.js data structures to plain JavaScript objects
 */
export function convertImmutableToPlainObject(
  data: Record<string, unknown> | { toJS?: () => unknown } | undefined,
): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  if ('toJS' in data && typeof data.toJS === 'function') {
    return data.toJS() as Record<string, unknown>;
  }

  return data as Record<string, unknown>;
}

/**
 * Extracts notes-only observations from raw form data
 * This handles cases where form2-controls doesn't return observations for fields without values
 */
export function extractNotesFromFormData(
  formData: Record<string, unknown> | undefined,
  transformedObservations: Form2Observation[],
): void {
  if (!formData || !Array.isArray(formData.children)) {
    return;
  }

  formData.children.forEach((child) => {
    if (child && typeof child === 'object') {
      processControlForNotesExtraction(
        child as Parameters<typeof processControlForNotesExtraction>[0],
        transformedObservations,
      );
    }
  });
}

/**
 * Recursively processes form controls to extract notes from fields without values
 * Appends notes-only observations to the provided array
 */
function processControlForNotesExtraction(
  control: {
    conceptUuid?: string;
    value?: unknown;
    comment?: string;
    interpretation?: string;
    id?: string;
    formFieldPath?: string;
    children?: unknown[];
    control?: { concept?: { uuid?: string } };
  },
  transformedObservations: Form2Observation[],
): void {
  const valueObj =
    control.value && typeof control.value === 'object'
      ? (control.value as Record<string, unknown>)
      : null;
  const valueComment = valueObj?.comment;
  const valueInterpretation = valueObj?.interpretation;
  const actualValue = valueObj?.value;

  const valueConcept =
    valueObj?.concept &&
    typeof valueObj.concept === 'object' &&
    'uuid' in valueObj.concept
      ? (valueObj.concept as { uuid?: string }).uuid
      : undefined;

  const controlConcept = control.control?.concept?.uuid;

  const conceptUuid = control.conceptUuid ?? valueConcept ?? controlConcept;

  const hasNoValue = valueObj
    ? actualValue === null || actualValue === undefined || actualValue === ''
    : control.value === null ||
      control.value === undefined ||
      control.value === '';
  const hasNotes =
    Boolean(control.comment ?? control.interpretation) ||
    Boolean(valueComment ?? valueInterpretation);

  if (
    hasNoValue &&
    hasNotes &&
    conceptUuid &&
    !transformedObservations.some((obs) => obs.concept.uuid === conceptUuid)
  ) {
    const observation: Form2Observation = {
      concept: {
        uuid: conceptUuid,
        datatype: undefined,
      },
      value: null,
      obsDatetime: new Date().toISOString(),
      formNamespace: 'Bahmni',
      formFieldPath: control.formFieldPath ?? control.id,
    };

    const finalComment = control.comment ?? valueComment;
    const finalInterpretation = control.interpretation ?? valueInterpretation;

    if (finalComment) {
      observation.comment = String(finalComment);
    }

    if (finalInterpretation) {
      observation.interpretation = String(finalInterpretation);
    }

    transformedObservations.push(observation);
  }

  if (Array.isArray(control.children)) {
    control.children.forEach((child) => {
      if (child && typeof child === 'object') {
        processControlForNotesExtraction(
          child as typeof control,
          transformedObservations,
        );
      }
    });
  }
}

/**
 * Returns true when a leaf control's value is considered empty.
 *
 * form2-controls serializes values differently per control type:
 * - Free-text / numeric / date: { value: "abc" | 123 | null }
 * - Coded / select:             { value: null, concept: { uuid, name } }
 * - Multi-select:               { value: null, concept: [{ uuid, name }] }
 *
 * A field is empty only when both `value.value` AND `value.concept` are absent.
 */
function isLeafValueEmpty(data: Record<string, unknown>): boolean {
  const valueObj =
    data.value && typeof data.value === 'object'
      ? (data.value as Record<string, unknown>)
      : null;

  if (!valueObj) {
    return data.value === null || data.value === undefined || data.value === '';
  }

  // Direct value (text, number, date)
  const directValue = valueObj.value;
  if (directValue !== null && directValue !== undefined && directValue !== '') {
    return false;
  }

  // Coded / select answer lives under value.concept
  const concept = valueObj.concept;
  if (concept !== null && concept !== undefined) {
    // multi-select returns an array
    if (Array.isArray(concept)) return concept.length === 0;
    return false;
  }

  return true;
}

/**
 * Checks if any visible, non-voided mandatory leaf fields in the Container data
 * have no values.
 *
 * form2-controls does not propagate mandatory errors back to the Container's internal
 * data structure when a field has never been interacted with by the user — this includes
 * always-visible mandatory fields that were never touched, and fields that transition
 * from hidden to visible via isHidden scripting without user interaction.
 * As a result, getValue().errors is empty for such fields even when they are required.
 *
 * This function traverses the Container's Immutable data (converted to plain JS via toJS())
 * to detect these missed violations directly.
 *
 * Only leaf nodes (no children) are checked for emptiness. Group/section controls
 * carry value: null themselves while the real data lives in their children — checking
 * the group node's own value would produce false positives.
 */
export function hasMissingMandatoryVisibleField(
  data: Record<string, unknown> | undefined,
): boolean {
  if (!data || typeof data !== 'object') return false;

  const children = data.children;
  const hasChildren = Array.isArray(children) && children.length > 0;

  const control = data.control as Record<string, unknown> | undefined;
  const properties = control?.properties as Record<string, unknown> | undefined;

  // Only validate leaf nodes — group/section controls have no value of their own
  if (
    !hasChildren &&
    properties?.mandatory === true &&
    !data.hidden &&
    !data.voided
  ) {
    if (isLeafValueEmpty(data)) {
      return true;
    }
  }

  // Skip hidden/voided subtrees entirely — their children are not visible
  if (data.hidden || data.voided) return false;

  // Recurse into children
  if (hasChildren) {
    return (children as unknown[]).some(
      (child) =>
        child &&
        typeof child === 'object' &&
        hasMissingMandatoryVisibleField(child as Record<string, unknown>),
    );
  }

  return false;
}
