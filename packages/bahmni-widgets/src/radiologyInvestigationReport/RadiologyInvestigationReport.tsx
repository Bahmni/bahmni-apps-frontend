import {
  getDiagnosticReportBundle,
  getFormattedError,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import type { Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ObservationsRenderer } from '../observationsRenderer';

export interface RadiologyInvestigationReportProps {
  reportId: string;
}

export const RadiologyInvestigationReport: React.FC<
  RadiologyInvestigationReportProps
> = ({ reportId }) => {
  const { t } = useTranslation();
  const {
    data: diagnosticReportBundle,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['diagnosticReportBundle', reportId],
    queryFn: () => getDiagnosticReportBundle(reportId),
    enabled: !!reportId,
  });

  const observations = useMemo(() => {
    if (!diagnosticReportBundle?.entry) {
      return [];
    }

    return (
      diagnosticReportBundle.entry
        ?.filter((e) => e.resource?.resourceType === 'Observation')
        .map((e) => e.resource as Observation) ?? []
    );
  }, [diagnosticReportBundle]);

  return (
    <ObservationsRenderer
      observations={observations}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error ? getFormattedError(error).message : undefined}
      emptyStateMessage={t('NO_REPORT_DATA')}
    />
  );
};

export default RadiologyInvestigationReport;
