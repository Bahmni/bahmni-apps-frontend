import { Accordion, AccordionItem, SkeletonText } from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useLabInvestigations from '@hooks/useLabInvestigations';
import { groupLabTestsByDate } from '@services/labInvestigationService';
import { LabTestsByDate } from '@types/labInvestigation';
import LabInvestigationItem from './LabInvestigationItem';
import * as styles from './styles/LabInvestigation.module.scss';

const LabInvestigationControl: React.FC = () => {
  const { t } = useTranslation();
  const { labTests, isLoading, hasError } = useLabInvestigations();

  // Group the lab tests by date
  const labTestsByDate = useMemo<LabTestsByDate[]>(() => {
    return groupLabTestsByDate(labTests);
  }, [labTests]);

  return (
    <section>
      <Accordion align="start" size="lg">
        {hasError && <div>{t('LAB_TEST_ERROR_LOADING')}</div>}
        {!isLoading && labTests.length === 0 && (
          <p className={styles.labInvestigationTableBodyError}>
            {t('LAB_TEST_UNAVAILABLE')}
          </p>
        )}
        {isLoading && labTests.length === 0 && (
          <>
            <SkeletonText lineCount={3} width="100%" />
            <div>{t('LAB_TEST_LOADING')}</div>
          </>
        )}
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

export default LabInvestigationControl;
