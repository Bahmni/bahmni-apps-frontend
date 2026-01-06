import { Accordion, AccordionItem, SkeletonText } from '@bahmni/design-system';
import {
  groupLabTestsByDate,
  shouldEnableEncounterFilter,
  useTranslation,
  LabTestsByDate,
  FormattedLabTest,
  getCategoryUuidFromOrderTypes,
  getFormattedError,
  getPatientLabInvestigations,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import LabInvestigationItem from './LabInvestigationItem';
import styles from './styles/LabInvestigation.module.scss';

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
  } = useQuery<FormattedLabTest[]>({
    queryKey: [
      'labInvestigations',
      categoryUuid,
      patientUUID,
      encounterUuids,
      numberOfVisits,
    ],
    enabled: !!patientUUID && !!categoryUuid && !emptyEncounterFilter,
    queryFn: () =>
      getPatientLabInvestigations(
        patientUUID!,
        categoryUuid,
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

  const labTests: FormattedLabTest[] = labTestsData ?? [];
  const isLoading = isLoadingOrderTypes || isLoadingLabInvestigations;
  const hasError = isOrderTypesError || isLabInvestigationsError;

  // Group the lab tests by date
  const labTestsByDate = useMemo<LabTestsByDate[]>(() => {
    return groupLabTestsByDate(labTests);
  }, [labTests]);

  if (hasError) {
    return (
      <div className={styles.labInvestigationTableBodyError}>
        {t('LAB_TEST_ERROR_LOADING')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <SkeletonText lineCount={3} width="100%" />
        <div>{t('LAB_TEST_LOADING')}</div>
      </>
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
    <section>
      <Accordion align="start" size="lg" className={styles.accordianHeader}>
        {labTestsByDate.map((group: LabTestsByDate, index) => (
          <AccordionItem
            key={group.date}
            className={styles.accordionItem}
            open={index === 0}
            title={
              <span className={styles.accordionTitle}>
                <strong>{group.date}</strong>
              </span>
            }
          >
            {/* Render 'urgent' tests first */}
            {group.tests
              ?.filter((test) => test.priority === 'Urgent')
              .map((test) => (
                <LabInvestigationItem
                  key={`urgent-${group.date}-${test.testName}-${test.id || test.testName}`}
                  test={test}
                />
              ))}

            {/* Then render non-urgent tests */}
            {group.tests
              ?.filter((test) => test.priority !== 'Urgent')
              .map((test) => (
                <LabInvestigationItem
                  key={`nonurgent-${group.date}-${test.testName}-${test.id || test.testName}`}
                  test={test}
                />
              ))}
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default LabInvestigation;
