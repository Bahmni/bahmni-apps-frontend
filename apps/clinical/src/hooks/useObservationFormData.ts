import {
  FormData,
  FormControlData,
  ObservationDataInFormControls,
  transformFormDataToObservations,
  validateFormData,
  hasFormData,
} from '@bahmni/services';
import { useCallback, useState } from 'react';

interface UseObservationFormDataProps {
  initialFormData?: FormData | null;
}

interface UseObservationFormDataReturn {
  formData: FormData | null;
  observations: ObservationDataInFormControls[];
  hasData: boolean;
  isValid: boolean;
  validationErrors: Array<{ field: string; message: string }>;
  handleFormDataChange: (data: unknown) => void;
  clearFormData: () => void;
}

export function useObservationFormData(
  props?: UseObservationFormDataProps,
): UseObservationFormDataReturn {
  const [formData, setFormData] = useState<FormData | null>(
    props?.initialFormData ?? null,
  );

  const handleFormDataChange = useCallback((data: unknown) => {
    let normalizedData: FormData | null = null;

    if (!data) {
      setFormData(null);
      return;
    }

    if (
      typeof data === 'object' &&
      'toJS' in data &&
      typeof (data as { toJS: unknown }).toJS === 'function'
    ) {
      const plainData = (data as { toJS: () => unknown }).toJS();

      if (
        plainData &&
        typeof plainData === 'object' &&
        !Array.isArray(plainData)
      ) {
        const formRecord = plainData as {
          children?: unknown[];
          control?: { id?: string; concept?: { uuid?: string } };
          value?: {
            value?: unknown;
            interpretation?: { uuid?: string; display?: string };
          };
          interpretation?: { uuid?: string; display?: string };
          formFieldPath?: string;
          voided?: boolean;
        };

        const extractControls = (
          record: typeof formRecord,
          controls: FormControlData[],
        ): void => {
          if (record.voided) {
            return;
          }

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
              const control: FormControlData = {
                id: fieldId,
                conceptUuid,
                type: 'obsControl' as const,
                value: record.value.value as
                  | string
                  | number
                  | boolean
                  | Date
                  | null,
              };

              // Add interpretation if present - check both possible locations
              // Check record level first, then inside value object
              const interpretationData =
                record.interpretation ?? record.value?.interpretation;

              if (
                interpretationData?.uuid &&
                typeof interpretationData.uuid === 'string'
              ) {
                control.interpretation = {
                  uuid: interpretationData.uuid,
                  display: interpretationData.display,
                };
              }

              controls.push(control);
            }
          }

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
    } else if (
      typeof data === 'object' &&
      'controls' in data &&
      Array.isArray((data as FormData).controls)
    ) {
      normalizedData = data as FormData;
    } else if (Array.isArray(data)) {
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

  const hasData = formData ? hasFormData(formData) : false;

  const validation = formData
    ? validateFormData(formData)
    : { isValid: true, errors: [] };
  const isValid = validation.isValid;
  const validationErrors = validation.errors;

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
