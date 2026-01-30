import { runEventScript } from '@bahmni/form2-controls';
import { Form2Observation, FormMetadata } from '@bahmni/services';

interface FormEventContext {
  observations: Form2Observation[];
  patient: { uuid: string };
  formName?: string;
  formUuid?: string;
  formData?: FormDataRecord;
}

type FormDataRecord = Record<string, unknown> & {
  control?: Record<string, unknown> & {
    concept?: { name?: string; uuid?: string };
    label?: { value?: string };
  };
  concept?: { name?: string };
  label?: { value?: string };
  name?: string;
  value?: unknown;
  children?: FormDataRecord[];
};

export const executeOnFormSaveEvent = (
  metadata: FormMetadata,
  observations: Form2Observation[],
  patientUuid: string,
  formData?: FormDataRecord,
): Form2Observation[] => {
  const schema = metadata.schema as Record<string, unknown>;
  const onFormSaveScript = (schema?.events as Record<string, unknown>)
    ?.onFormSave as string;

  if (!onFormSaveScript) {
    return observations;
  }

  try {
    if (
      typeof onFormSaveScript !== 'string' ||
      onFormSaveScript.trim() === ''
    ) {
      throw new Error('Invalid onFormSave script: not a string or empty');
    }

    const formContext: FormEventContext = {
      observations: JSON.parse(JSON.stringify(observations)),
      patient: { uuid: patientUuid },
      formName: metadata.name,
      formUuid: metadata.uuid,
      formData: formData,
    };

    const result = runEventScript(
      formData,
      onFormSaveScript,
      formContext.patient,
    );

    if (Array.isArray(result)) {
      return result;
    }

    return formContext.observations;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'Unknown error occurred';

    const formattedError = `Error in onFormSave event for form "${metadata.name}": ${errorMessage}`;

    throw new Error(formattedError);
  }
};
