import {
  Accordion,
  AccordionItem,
  CodeSnippetSkeleton,
} from '@bahmni/design-system';
import {
  shouldEnableEncounterFilter,
  useTranslation,
  getCategoryUuidFromOrderTypes,
  getFormattedError,
  getLabInvestigationsBundle,
  getDiagnosticReports,
} from '@bahmni/services';
import { useQuery, useQueries } from '@tanstack/react-query';
import type { DiagnosticReport } from 'fhir/r4';
import React, { useMemo, useEffect, useState } from 'react';

import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import LabInvestigationItem from './LabInvestigationItem';
import { FormattedLabInvestigations, LabInvestigationsByDate } from './models';
import styles from './styles/LabInvestigation.module.scss';
import {
  filterLabInvestigationEntries,
  formatLabInvestigations,
  groupLabInvestigationsByDate,
  getProcessedTestIds,
  getTestIdToReportIdMap,
  extractDiagnosticReportsFromBundle,
  sortLabInvestigationsByPriority,
} from './utils';

const fetchLabInvestigations = async (
  patientUUID: string,
  category: string,
  t: (key: string) => string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<FormattedLabInvestigations[]> => {
  const bundle = await getLabInvestigationsBundle(
    patientUUID,
    category,
    encounterUuids,
    numberOfVisits,
  );
  const filteredEntries = filterLabInvestigationEntries(bundle);
  return formatLabInvestigations(filteredEntries, t);
};

const LabInvestigation: React.FC<WidgetProps> = ({
  config,
  encounterUuids,
  episodeOfCareUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const categoryName = config?.orderType as string;
  const numberOfVisits = config?.numberOfVisits as number;
  const [openAccordionIndices, setOpenAccordionIndices] = useState<Set<number>>(
    new Set([0]),
  );

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: categoryUuid,
    isLoading: isLoadingOrderTypes,
    isError: isOrderTypesError,
    error: orderTypesError,
  } = useQuery({
    queryKey: ['categoryUuid', categoryName],
    queryFn: () => getCategoryUuidFromOrderTypes(categoryName),
    enabled: !!categoryName,
  });

  const {
    data: labTestsData,
    isLoading: isLoadingLabInvestigations,
    isError: isLabInvestigationsError,
    error: labInvestigationsError,
  } = useQuery<FormattedLabInvestigations[]>({
    queryKey: [
      'labInvestigations',
      categoryUuid,
      patientUUID,
      encounterUuids,
      numberOfVisits,
    ],
    enabled: !!patientUUID && !!categoryUuid && !emptyEncounterFilter,
    queryFn: () =>
      fetchLabInvestigations(
        patientUUID!,
        categoryUuid!,
        t,
        encounterUuids,
        numberOfVisits,
      ),
  });

  useEffect(() => {
    if (isOrderTypesError) {
      const { message } = getFormattedError(orderTypesError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
    if (isLabInvestigationsError) {
      const { message } = getFormattedError(labInvestigationsError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
  }, [
    isOrderTypesError,
    orderTypesError,
    isLabInvestigationsError,
    labInvestigationsError,
    addNotification,
    t,
  ]);

  const labTests: FormattedLabInvestigations[] = useMemo(
    () => labTestsData ?? [],
    [labTestsData],
  );
  const isLoading = isLoadingOrderTypes || isLoadingLabInvestigations;
  const hasError = isOrderTypesError || isLabInvestigationsError;

  const sortedLabInvestigationsByDate = useMemo<
    LabInvestigationsByDate[]
  >(() => {
    const groupedTests = groupLabInvestigationsByDate(labTests);
    return sortLabInvestigationsByPriority(groupedTests);
  }, [labTests]);

  // Fetch diagnostic reports for each accordion separately to enable caching
  const diagnosticReportQueries = useQueries({
    queries: sortedLabInvestigationsByDate.map((group, index) => {
      const testIds = group.tests.map((test) => test.id);
      return {
        queryKey: ['diagnosticReports', patientUUID, index, testIds],
        queryFn: () => getDiagnosticReports(patientUUID!, testIds),
        enabled:
          !!patientUUID &&
          openAccordionIndices.has(index) &&
          testIds.length > 0,
      };
    }),
  });

  // Merge all diagnostic reports from open accordions
  const diagnosticReports = useMemo<DiagnosticReport[]>(() => {
    const reports = diagnosticReportQueries
      .filter((query) => query.data)
      .flatMap((query) => extractDiagnosticReportsFromBundle(query.data));
    return reports;
  }, [diagnosticReportQueries]);

  const processedTestIds = useMemo(() => {
    return getProcessedTestIds(diagnosticReports);
  }, [diagnosticReports]);

  const testIdToReportIdMap = useMemo(() => {
    return getTestIdToReportIdMap(diagnosticReports);
  }, [diagnosticReports]);

  if (hasError) {
    return (
      <div className={styles.labInvestigationTableBodyError}>
        {t('LAB_TEST_ERROR_LOADING')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <CodeSnippetSkeleton
        type="multi"
        className={styles.labSkeleton}
        testId="lab-skeleton"
      />
    );
  }

  if (!isLoading && (labTests.length === 0 || emptyEncounterFilter)) {
    return (
      <div className={styles.labInvestigationTableBodyError}>
        {t('LAB_TEST_UNAVAILABLE')}
      </div>
    );
  }

  return (
    <Accordion align="start">
      {sortedLabInvestigationsByDate.map(
        (group: LabInvestigationsByDate, index) => (
          <AccordionItem
            key={group.date}
            className={styles.accordionItem}
            open={openAccordionIndices.has(index)}
            onHeadingClick={() => {
              setOpenAccordionIndices((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(index)) {
                  newSet.delete(index);
                } else {
                  newSet.add(index);
                }
                return newSet;
              });
            }}
            title={group.date}
          >
            {group.tests?.map((test) => (
              <LabInvestigationItem
                key={`${group.date}-${test.testName}-${test.id || test.testName}`}
                test={test}
                isOpen={openAccordionIndices.has(index)}
                hasProcessedReport={processedTestIds.includes(test.id)}
                reportId={testIdToReportIdMap.get(test.id)}
              />
            ))}
          </AccordionItem>
        ),
      )}
    </Accordion>
  );
};

export default LabInvestigation;
