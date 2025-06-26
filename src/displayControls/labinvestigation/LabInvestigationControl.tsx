import React, { useMemo } from 'react';
import * as styles from './styles/LabInvestigation.module.scss';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionItem, SkeletonText } from '@carbon/react';
import LabInvestigationItem from './LabInvestigationItem';
import useLabInvestigations from '@hooks/useLabInvestigations';
import { groupLabTestsByDate } from '@services/labInvestigationService';
import { LabTestsByDate } from '@types/labInvestigation';

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
              .map((test, index) => (
                <LabInvestigationItem
                  key={`urgent-${group.date}-${test.testName}-${index}`}
                  test={test}
                />
              ))}

            {/* Then render non-urgent tests */}
            {group.tests
              ?.filter((test) => test.priority !== 'Urgent')
              .map((test, index) => (
                <LabInvestigationItem
                  key={`nonurgent-${group.date}-${test.testName}-${index}`}
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
