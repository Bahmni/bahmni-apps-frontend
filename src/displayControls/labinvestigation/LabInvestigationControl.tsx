import React, { useMemo } from 'react';
import * as styles from './styles/LabInvestigation.module.scss';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionItem } from '@carbon/react';
import LabInvestigationItem from './LabInvestigationItem';
import useLabInvestigations from '@/hooks/useLabInvestigations';
import { groupLabTestsByDate } from '@/services/labInvestigationService';
import { LabTestsByDate, FormattedLabTest } from '@/types/labInvestigation';

const LabInvestigationControl: React.FC = () => {
  const { t } = useTranslation();
  const { labTests, isLoading, isError } = useLabInvestigations();

  // Group the lab tests by date
  const labTestsByDate = useMemo<LabTestsByDate[]>(() => {
    return groupLabTestsByDate(labTests);
  }, [labTests]);

  if (isLoading && labTests.length === 0) {
    return <div>{t('Loading lab tests...')}</div>;
  }

  if (isError) {
    return <div>{t('Error loading lab tests')}</div>;
  }

  if (!isLoading && labTests.length === 0) {
    return <div>{t('No lab Investigations available')}</div>;
  }

  return (
    <section className={styles.labInvestigationWrapper}>
      <Accordion align="start" size="lg">
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
