import { Tag, Tile } from '@carbon/react';
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableDataTable } from '@/components/common/sortableDataTable/SortableDataTable';
import { DATE_FORMAT } from '@constants/date';
import { useDiagnoses } from '@hooks/useDiagnoses';
import { Diagnosis } from '@types/diagnosis';
import { formatDate, sortByDate } from '@utils/date';
import * as styles from './styles/DiagnosesTable.module.scss';

/**
 * Component to display patient diagnoses grouped by date in accordion format
 * Each accordion item contains an ExpandableDataTable with diagnoses for that date
 */
const DiagnosesTable: React.FC = () => {
  const { t } = useTranslation();
  const { diagnoses, loading, error } = useDiagnoses();

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: t('DIAGNOSIS_LIST_DIAGNOSIS') },
      { key: 'recordedDate', header: t('DIAGNOSIS_RECORDED_DATE') },
      { key: 'recorder', header: t('DIAGNOSIS_LIST_RECORDED_BY') },
    ],
    [t],
  );

  const processedDiagnoses = useMemo(() => {
    return sortByDate(diagnoses, 'recordedDate');
  }, [diagnoses]);

  const renderCell = useCallback(
    (diagnosis: Diagnosis, cellId: string) => {
      switch (cellId) {
        case 'display':
          return (
            <div>
              <div className={styles.diagnosisName}>{diagnosis.display}</div>
              <Tag
                data-testid={'certainity-tag'}
                className={
                  diagnosis.certainty.code === 'confirmed'
                    ? styles.confirmedCell
                    : styles.provisionalCell
                }
              >
                {diagnosis.certainty.code === 'confirmed'
                  ? t('CERTAINITY_CONFIRMED')
                  : t('CERTAINITY_PROVISIONAL')}
              </Tag>
            </div>
          );
        case 'recordedDate':
          return formatDate(diagnosis.recordedDate, DATE_FORMAT)
            .formattedResult;
        case 'recorder':
          return diagnosis.recorder || t('DIAGNOSIS_TABLE_NOT_AVAILABLE');
      }
    },
    [t],
  );

  return (
    <>
      <Tile
        title={t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}
        data-testid="diagnoses-title"
        className={styles.diagnosesTableTitle}
      >
        <p>{t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}</p>
      </Tile>
      <div data-testid="diagnoses-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}
          rows={processedDiagnoses}
          loading={loading}
          errorStateMessage={error?.message}
          emptyStateMessage={t('NO_DIAGNOSES')}
          renderCell={renderCell}
          className={styles.diagnosesTableBody}
        />
      </div>
    </>
  );
};

export default DiagnosesTable;
