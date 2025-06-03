import React, { useState, useEffect } from 'react';
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMainAccordionExpanded, setIsMainAccordionExpanded] = useState(true);

  // Set the last two visits (first two date groups) to be expanded by default
  useEffect(() => {
    if (diagnosesByDate.length > 0) {
      const lastTwoVisits = new Set<string>();
      
      // Add the first two date groups (most recent visits) to expanded set
      for (let i = 0; i < Math.min(2, diagnosesByDate.length); i++) {
        lastTwoVisits.add(diagnosesByDate[i].rawDate);
      }
      
      setExpandedItems(lastTwoVisits);
    }
  }, [diagnosesByDate]);

  const handleAccordionChange = (rawDate: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rawDate)) {
        newSet.delete(rawDate);
      } else {
        newSet.add(rawDate);
      }
      return newSet;
    });
  };

  const handleMainAccordionChange = () => {
    setIsMainAccordionExpanded(prev => !prev);
  };

  if (isLoading && diagnosesByDate.length === 0) {
    return <div>{t('DIAGNOSES_LOADING')}</div>;
  }

  if (isError) {
    return <div>{t('DIAGNOSES_ERROR_LOADING')}</div>;
  }

  return (
    <section className={styles.diagnosesWrapper} data-testid="diagnoses-control">
      <Accordion>
        <AccordionItem 
          title={t('DIAGNOSES_FORM_TITLE')} 
          className={styles.accordionItem}
          open={isMainAccordionExpanded}
          onHeadingClick={handleMainAccordionChange}
        >
          {!isLoading && diagnosesByDate.length === 0 ? (
            // Show no data message inside the accordion when there are no diagnoses
            <div className={styles.noData}>{t('DIAGNOSES_NO_DIAGNOSES')}</div>
          ) : (
            <>
              {/* Table Header */}
              <div className={styles.tableHeader}>
                <div className={styles.diagnosesColumn}>{t('DIAGNOSES_COLUMN_HEADER')}</div>
                <div className={styles.recordedByColumn}>{t('DIAGNOSES_RECORDED_BY_COLUMN')}</div>
              </div>
              
              {/* Date Groups */}
              <Accordion align="start" size="lg">
                {diagnosesByDate.map((dateGroup: DiagnosesByDate) => (
                  <AccordionItem
                    key={dateGroup.rawDate}
                    className={styles.accordionItem}
                    title={dateGroup.date}
                    open={expandedItems.has(dateGroup.rawDate)}
                    onHeadingClick={() => handleAccordionChange(dateGroup.rawDate)}
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
            </>
          )}
        </AccordionItem>
      </Accordion>
    </section>
  );
};

export default DiagnosesControl;
