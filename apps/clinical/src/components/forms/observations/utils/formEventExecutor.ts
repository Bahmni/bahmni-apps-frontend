import { runEventScript } from '@bahmni/form2-controls';
import { Form2Observation, FormMetadata } from '@bahmni/services';
import { FormPatientContext } from '../../../../models/observationForms';

interface FormEventContext {
  observations: Form2Observation[];
  patient: FormPatientContext;
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
  patient: FormPatientContext,
  formData?: FormDataRecord,
): Form2Observation[] => {
  const schema = metadata.schema as Record<string, unknown>;
  const onFormSaveScript = (schema?.events as Record<string, unknown>)
    ?.onFormSave as string;

  if (!onFormSaveScript) {
    console.log('[formEventExecutor] No onFormSave script found in form schema, skipping.');
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
      patient,
      formName: metadata.name,
      formUuid: metadata.uuid,
      formData: formData,
    };

    console.log('[formEventExecutor] Executing onFormSave script for form:', metadata.name);
    console.log('[formEventExecutor] Patient context passed to script:', patient);
    console.log('[formEventExecutor] Observations before script:', observations);

    const result = runEventScript(
      formData,
      onFormSaveScript,
      formContext.patient,
    );

    console.log('[formEventExecutor] Script result:', result);

    if (Array.isArray(result)) {
      console.log('[formEventExecutor] Script returned modified observations:', result);
      return result;
    }

    console.log('[formEventExecutor] Script returned non-array, using context observations:', formContext.observations);
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
