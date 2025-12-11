import {
  FormData,
  FormControlData,
  ObservationPayload,
  transformFormDataToObservations,
  validateFormData,
  hasFormData,
} from '@bahmni/services';
import { useCallback, useState } from 'react';

interface UseObservationFormDataProps {
  // Optional: Existing form data to initialize with (for edit mode)
  initialFormData?: FormData | null;
}

interface UseObservationFormDataReturn {
  formData: FormData | null;
  observations: ObservationPayload[];
  hasData: boolean;
  isValid: boolean;
  validationErrors: Array<{ field: string; message: string }>;
  handleFormDataChange: (data: unknown) => void;
  clearFormData: () => void;
}

/**
 * Hook to manage observation form data capture and transformation
 *
 * This hook:
 * - Captures form data from form2-controls Container
 * - Validates the form data
 * - Transforms it to observation payloads
 * - Provides the observations to be included in consultation bundle
 *
 * @param props - Optional initial form data for edit mode
 * @returns Form data management utilities and transformed observations
 */
export function useObservationFormData(
  props?: UseObservationFormDataProps,
): UseObservationFormDataReturn {
  const [formData, setFormData] = useState<FormData | null>(
    props?.initialFormData ?? null,
  );

  const handleFormDataChange = useCallback((data: unknown) => {
    // Validate and normalize the incoming data
    let normalizedData: FormData | null = null;

    if (!data) {
      setFormData(null);
      return;
    }

    // Check if data is an Immutable.js object (has toJS method)
    if (
      typeof data === 'object' &&
      'toJS' in data &&
      typeof (data as { toJS: unknown }).toJS === 'function'
    ) {
      const plainData = (data as { toJS: () => unknown }).toJS();

      // Now process the plain data
      if (
        plainData &&
        typeof plainData === 'object' &&
        !Array.isArray(plainData)
      ) {
        // The form2-controls data structure has a 'children' array containing form records
        const formRecord = plainData as {
          children?: unknown[];
          control?: { id?: string; concept?: { uuid?: string } };
          value?: { value?: unknown };
          formFieldPath?: string;
          voided?: boolean;
        };

        // Recursive function to extract controls from form record tree
        const extractControls = (
          record: typeof formRecord,
          controls: FormControlData[],
        ): void => {
          // Skip voided records
          if (record.voided) {
            return;
          }

          // Check if this record has a value to capture
          if (
            record.control &&
            record.value?.value !== null &&
            record.value?.value !== undefined &&
            record.value?.value !== ''
          ) {
            const conceptUuid = record.control.concept?.uuid;
            const fieldId =
              record.formFieldPath ?? record.control.id ?? 'unknown';

            if (conceptUuid) {
              controls.push({
                id: fieldId,
                conceptUuid,
                type: 'obsControl' as const,
                value: record.value.value as
                  | string
                  | number
                  | boolean
                  | Date
                  | null,
              });
            }
          }

          // Recursively process children
          if (record.children && Array.isArray(record.children)) {
            record.children.forEach((child) => {
              if (child && typeof child === 'object') {
                extractControls(child as typeof formRecord, controls);
              }
            });
          }
        };

        const controls: FormControlData[] = [];
        extractControls(formRecord, controls);

        normalizedData = {
          controls,
          metadata: {},
        };
      }
    }
    // Check if data already has the expected FormData structure
    else if (
      typeof data === 'object' &&
      'controls' in data &&
      Array.isArray((data as FormData).controls)
    ) {
      normalizedData = data as FormData;
    }
    // Check if data is an observations array (alternative format)
    else if (Array.isArray(data)) {
      normalizedData = {
        controls: data,
        metadata: {},
      };
    }

    setFormData(normalizedData);
  }, []);

  const clearFormData = useCallback(() => {
    setFormData(null);
  }, []);

  // Check if form has any data
  const hasData = formData ? hasFormData(formData) : false;

  // Validate form data
  const validation = formData ? validateFormData(formData) : { isValid: true, errors: [] };
  const isValid = validation.isValid;
  const validationErrors = validation.errors;

  // Transform to observations (only if valid and has data)
  const observations =
    formData && isValid && hasData
      ? transformFormDataToObservations(formData)
      : [];

  return {
    formData,
    observations,
    hasData,
    isValid,
    validationErrors,
    handleFormDataChange,
    clearFormData,
  };
}
