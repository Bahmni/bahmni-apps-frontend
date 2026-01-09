import {
  FormData,
  FormControlData,
  Form2Observation,
  FormMetadata,
  ConceptValue,
  ComplexValue,
  transformFormDataToObservations,
  fetchFormMetadata,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  FORM_CONTROL_TYPE_OBS_GROUP,
  FORM_CONTROL_TYPE_OBS,
  FORM_CONTROL_TYPE_MULTISELECT,
} from '../constants/forms';

interface UseObservationFormDataProps {
  initialFormData?: FormData | null;
  formMetadata?: FormMetadata;
  formUuid?: string;
}

interface UseObservationFormDataReturn {
  formData: FormData | null;
  observations: Form2Observation[];
  handleFormDataChange: (data: unknown) => void;
  resetForm: () => void;
  // Metadata fetching (consolidated from useObservationFormMetadata)
  formMetadata: FormMetadata | undefined;
  isLoadingMetadata: boolean;
  metadataError: Error | null;
}

interface ImmutableData {
  toJS(): unknown;
}

interface FormControlRecord {
  control?: {
    concept?: { name?: string; uuid?: string };
    type?: string;
  };
  formFieldPath?: string;
  value?: {
    value?: unknown;
    interpretation?: string;
  };
  children?: FormControlRecord[];
  voided?: boolean;
}

interface FormControlTree {
  formFieldPath: string;
  children?: FormControlRecord[];
}

const isImmutableData = (data: unknown): data is ImmutableData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'toJS' in data &&
    typeof (data as ImmutableData).toJS === 'function'
  );
};

const isFormControlTree = (data: unknown): data is FormControlTree => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'formFieldPath' in data &&
    'children' in data
  );
};

const isFormData = (data: unknown): data is FormData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'controls' in data &&
    Array.isArray((data as FormData).controls)
  );
};

/**
 * Hook to manage observation form data and metadata
 *
 * This hook consolidates form metadata fetching (formerly useObservationFormMetadata)
 * and form data management. It can be used in two ways:
 * 1. Pass formUuid to fetch metadata automatically
 * 2. Pass formMetadata directly if already available
 *
 * @param props - Configuration object with formUuid or formMetadata
 * @returns Form data state, validation, observations, and metadata
 */
export function useObservationFormData(
  props?: UseObservationFormDataProps,
): UseObservationFormDataReturn {
  const [formData, setFormData] = useState<FormData | null>(
    props?.initialFormData ?? null,
  );

  // Fetch form metadata if formUuid is provided (consolidated from useObservationFormMetadata)
  const {
    data: fetchedMetadata,
    isLoading: isLoadingMetadata,
    error: queryError,
  } = useQuery<FormMetadata>({
    queryKey: ['formMetadata', props?.formUuid],
    queryFn: () => fetchFormMetadata(props!.formUuid!),
    enabled: !!props?.formUuid,
  });

  // Use provided metadata or fetched metadata
  const formMetadata = props?.formMetadata ?? fetchedMetadata;
  const metadataError = queryError ? (queryError as Error) : null;

  const handleFormDataChange = useCallback((data: unknown) => {
    if (!data) {
      setFormData(null);
      return;
    }

    const plainData = isImmutableData(data) ? data.toJS() : data;

    const extractControls = (
      record: FormControlTree,
      controls: FormControlData[],
    ): void => {
      if (!record.children) return;

      record.children.forEach((controlRecord) => {
        if (controlRecord.voided) return;

        const conceptUuid = controlRecord.control?.concept?.uuid;
        const fieldPath = controlRecord.formFieldPath;
        if (!conceptUuid || !fieldPath) return;

        const isObsGroupControl =
          controlRecord.control?.type === FORM_CONTROL_TYPE_OBS_GROUP;

        if (isObsGroupControl) {
          if (controlRecord.children?.length) {
            const groupMembers: FormControlData[] = [];
            extractControls(
              { formFieldPath: '', children: controlRecord.children },
              groupMembers,
            );

            if (groupMembers.length > 0) {
              controls.push({
                id: fieldPath,
                conceptUuid,
                type: FORM_CONTROL_TYPE_OBS,
                value: null,
                groupMembers,
              });
            }
          }
          return;
        }

        const value = controlRecord.value?.value;
        if (value === null || value === undefined || value === '') return;

        const control: FormControlData = {
          id: fieldPath,
          conceptUuid,
          type: Array.isArray(value)
            ? FORM_CONTROL_TYPE_MULTISELECT
            : FORM_CONTROL_TYPE_OBS,
          value: value as
            | string
            | number
            | boolean
            | Date
            | ConceptValue
            | ConceptValue[]
            | ComplexValue
            | null,
        };

        if (controlRecord.value?.interpretation) {
          control.interpretation = controlRecord.value.interpretation;
        }

        controls.push(control);
      });
    };

    let normalizedData: FormData | null = null;

    if (isFormControlTree(plainData)) {
      const controls: FormControlData[] = [];
      extractControls(plainData, controls);
      normalizedData = { controls, metadata: {} };
    } else if (isFormData(plainData)) {
      normalizedData = plainData;
    } else if (Array.isArray(plainData)) {
      normalizedData = { controls: plainData, metadata: {} };
    }

    setFormData(normalizedData);
  }, []);

  const resetForm = () => {
    setFormData(null);
  };

  const observations =
    formData && formMetadata
      ? transformFormDataToObservations(formData, formMetadata)
      : [];

  return {
    formData,
    observations,
    handleFormDataChange,
    resetForm,
    formMetadata,
    isLoadingMetadata,
    metadataError,
  };
}
