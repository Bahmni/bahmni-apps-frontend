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
    return {
      concept: { uuid: member.conceptUuid, datatype },
      value: transformControlValue(member),
      obsDatetime: new Date().toISOString(),
      formNamespace: DEFAULT_FORM_NAMESPACE,
      formFieldPath: member.id,
      interpretation: member.interpretation,
      groupMembers: member.groupMembers
        ? transformGroupMembers(member.groupMembers, metadata)
        : undefined,
    };
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
      observations.push({
        concept: { uuid: control.conceptUuid, datatype },
        value: null,
        obsDatetime: timestamp,
        formNamespace: DEFAULT_FORM_NAMESPACE,
        formFieldPath: control.id,
        groupMembers: transformGroupMembers(control.groupMembers, metadata),
      });
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

      controlsMap.set(fieldPath, control);
    }
  });

  return {
    controls: Array.from(controlsMap.values()),
    metadata: { formMetadata },
  };
}
