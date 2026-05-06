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
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import type { DiagnosticReport } from 'fhir/r4';
import React, { useMemo, useEffect, useState } from 'react';

import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import {
  extractDiagnosticReportsFromBundle,
  updateInvestigationsWithReportInfo,
} from '../utils/Investigations';
import LabInvestigationItem from './LabInvestigationItem';
import { FormattedLabInvestigations, LabInvestigationsByDate } from './models';
import styles from './styles/LabInvestigation.module.scss';
import {
  filterLabInvestigationEntries,
  formatLabInvestigations,
  groupLabInvestigationsByDate,
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
  const [currentOpenedAccordionIndex, setCurrentOpenedAccordionIndex] =
    useState<number>(0);

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
    refetch: refetchLabInvestigations,
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

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        categoryName &&
        payload.updatedResources.serviceRequests?.[categoryName.toLowerCase()]
      ) {
        refetchLabInvestigations();
      }
    },
    [patientUUID, categoryName],
  );

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

  const sortedLabInvestigations = useMemo<LabInvestigationsByDate[]>(() => {
    const groupedTests = groupLabInvestigationsByDate(labTests);
    return sortLabInvestigationsByPriority(groupedTests);
  }, [labTests]);

  // Fetch diagnostic reports only for the most recently opened accordion
  const currentAccordionGroup =
    sortedLabInvestigations[currentOpenedAccordionIndex];
  const testIds = currentAccordionGroup?.tests.map((test) => test.id) ?? [];

  const { data: diagnosticReportsBundle } = useQuery({
    queryKey: [
      'diagnosticReports',
      patientUUID,
      currentOpenedAccordionIndex,
      testIds,
    ],
    queryFn: () => getDiagnosticReports(patientUUID!, testIds),
    enabled:
      !!patientUUID &&
      openAccordionIndices.has(currentOpenedAccordionIndex) &&
      testIds.length > 0,
  });

  const diagnosticReports = useMemo<DiagnosticReport[]>(() => {
    if (!diagnosticReportsBundle) return [];
    return extractDiagnosticReportsFromBundle(diagnosticReportsBundle);
  }, [diagnosticReportsBundle]);

  const updatedLabInvestigations = useMemo<LabInvestigationsByDate[]>(() => {
    return sortedLabInvestigations.map((group) => ({
      ...group,
      tests: updateInvestigationsWithReportInfo(group.tests, diagnosticReports),
    }));
  }, [sortedLabInvestigations, diagnosticReports]);

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
      {updatedLabInvestigations.map((group: LabInvestigationsByDate, index) => (
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
                setCurrentOpenedAccordionIndex(index);
              }
              return newSet;
            });
          }}
          title={group.date}
        >
          {group.tests?.map((test) => (
            <LabInvestigationItem
              key={test.id ?? `${group.date}-${test.testName}`}
              test={test}
              isOpen={openAccordionIndices.has(index)}
              hasProcessedReport={!!test.reportId}
              reportId={test.reportId}
            />
          ))}
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default LabInvestigation;
