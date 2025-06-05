import React, { useMemo } from 'react';
import * as styles from './styles/LabInvestigation.module.scss';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionItem, SkeletonText } from '@carbon/react';
import LabInvestigationItem from './LabInvestigationItem';
import useLabInvestigations from '@/hooks/useLabInvestigations';
import { groupLabTestsByDate } from '@/services/labInvestigationService';
import { LabTestsByDate, FormattedLabTest } from '@types/labInvestigation';

const LabInvestigationControl: React.FC = () => {
  const { t } = useTranslation();
  const { labTests, isLoading, isError } = useLabInvestigations();

  // Group the lab tests by date
  const labTestsByDate = useMemo<LabTestsByDate[]>(() => {
    return groupLabTestsByDate(labTests);
  }, [labTests]);

  if (isError) {
    return <div>{t('LAB_TEST_ERROR_LOADING')}</div>;
  }

  if (!isLoading && labTests.length === 0) {
    return <div>{t('LAB_TEST_UNAVAILABLE')}</div>;
  }

  return (
    <section className={styles.labInvestigationWrapper}>
      <Accordion align="start" size="lg">
        {isLoading && labTests.length === 0 && (
          <>
            <SkeletonText lineCount={3} width="100%" />
            <div>{t('LAB_TEST_LOADING')}</div>
          </>
        )}
        {labTestsByDate.map((group: LabTestsByDate) => (
          <AccordionItem
            key={group.date}
            className={styles.accordionItem}
            title={
              <span className={styles.accordionTitle}>
                <strong>{group.date}</strong>
              </span>
            }
          >
            {group.tests?.map((test: FormattedLabTest, testIndex: number) => (
              <LabInvestigationItem key={testIndex} test={test} />
            ))}
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default LabInvestigationControl;
