import React from 'react';
import { Accordion, AccordionItem } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/Diagnoses.module.scss';
import DiagnosisItem from './DiagnosesItem';
import useDiagnoses from '@/hooks/useDiagnoses';
import { DiagnosesByDate } from '@/types/diagnosis';

/**
 * Component to display patient diagnoses grouped by date and recorder
 */
const DiagnosesControl: React.FC = () => {
  const { t } = useTranslation();
  const { diagnosesByDate, isLoading, isError } = useDiagnoses();

  if (isLoading && diagnosesByDate.length === 0) {
    return <div>{t('DIAGNOSES_LOADING')}</div>;
  }

  if (isError) {
    return <div>{t('DIAGNOSES_ERROR_LOADING')}</div>;
  }

  if (!isLoading && diagnosesByDate.length === 0) {
    return <div className={styles.noData}>{t('DIAGNOSES_NO_DIAGNOSES')}</div>;
  }

  return (
    <section className={styles.diagnosesWrapper} data-testid="diagnoses-control">
      <Accordion>
        <AccordionItem title={t('DIAGNOSES_FORM_TITLE')} className={styles.accordionItem}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div className={styles.diagnosesColumn}>Diagnoses</div>
        <div className={styles.recordedByColumn}>Recorded by</div>
      </div>
      
      {/* Date Groups */}
      <Accordion align="start" size="lg">
        {diagnosesByDate.map((dateGroup: DiagnosesByDate) => (
          <AccordionItem
            key={dateGroup.rawDate}
            className={styles.accordionItem}
            title={dateGroup.date}
          >
            <div>
              {dateGroup.diagnoses.map((diagnosis, diagnosisIndex) => (
                <DiagnosisItem 
                  key={diagnosis.id || diagnosisIndex} 
                  diagnosis={diagnosis}
                />
              ))}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
        </AccordionItem>
      </Accordion>
    </section>
  );
};

export default DiagnosesControl;
