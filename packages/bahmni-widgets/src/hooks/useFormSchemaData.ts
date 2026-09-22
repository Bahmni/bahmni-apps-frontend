import {
  fetchFormMetadata,
  fetchObservationForms,
  getFormattedError,
  type FormMetadata,
  type ObservationForm,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { deriveFormSchemaData } from '../utils/Observations';

export const useFormSchemaData = (formName?: string) => {
  const { data: publishedForms = [], isLoading: isLoadingForms } = useQuery<
    ObservationForm[]
  >({
    queryKey: ['observationForms'],
    queryFn: () => fetchObservationForms(),
    enabled: !!formName,
  });

  const formUuid = useMemo(() => {
    if (!formName) return undefined;
    return publishedForms.find(
      (form) => form.name.toLowerCase() === formName.toLowerCase(),
    )?.uuid;
  }, [publishedForms, formName]);

  const {
    data: formMetadata,
    isLoading: isLoadingMetadata,
    isError,
    error,
  } = useQuery<FormMetadata>({
    queryKey: ['formMetadata', formUuid],
    queryFn: () => fetchFormMetadata(formUuid!),
    enabled: !!formUuid,
  });

  const { controlOrder, sectionMap, conceptDatatypeMap } = useMemo(
    () => deriveFormSchemaData(formMetadata?.schema),
    [formMetadata],
  );

  return {
    controlOrder,
    sectionMap,
    conceptDatatypeMap,
    isLoading: isLoadingForms || isLoadingMetadata,
    isError,
    errorMessage: error ? getFormattedError(error).message : undefined,
  };
};
