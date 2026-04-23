import {
  fetchQualityAssessment,
  getFormattedError,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import type { Observation } from 'fhir/r4';
import React, { useEffect, useMemo } from 'react';
import { ObservationsRenderer } from '../observationsRenderer';

export interface QualityAssessmentProps {
  imagingStudyId: string | null;
  onDateLoaded?: (date: string | undefined) => void;
}

export const QualityAssessment: React.FC<QualityAssessmentProps> = ({
  imagingStudyId,
  onDateLoaded,
}) => {
  const { t } = useTranslation();

  const {
    data: imagingStudy,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['qualityAssessment', imagingStudyId],
    queryFn: () => fetchQualityAssessment(imagingStudyId!),
    enabled: !!imagingStudyId,
  });

  const observations = useMemo(() => {
    if (!imagingStudy?.contained) {
      return [];
    }

    return imagingStudy.contained.filter(
      (resource) => resource.resourceType === 'Observation',
    ) as Observation[];
  }, [imagingStudy]);

  useEffect(() => {
    if (imagingStudy && onDateLoaded) {
      const firstObs = observations[0];
      const date = firstObs?.effectiveDateTime ?? firstObs?.issued;
      onDateLoaded(date);
    }
  }, [imagingStudy, observations, onDateLoaded]);

  const errorMessage = isError && error ? getFormattedError(error).message : '';

  return (
    <ObservationsRenderer
      observations={observations}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      emptyStateMessage={t('NO_QUALITY_ASSESSMENT_DATA')}
    />
  );
};

export default QualityAssessment;
