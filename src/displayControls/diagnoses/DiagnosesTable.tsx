import React, { useMemo } from 'react';
import { Tag, Tile, DataTableSkeleton } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { useDiagnoses } from '@hooks/useDiagnoses';
import { FormattedDiagnosis } from '@types/diagnosis';
import { formatDate } from '@utils/date';
import { FULL_MONTH_DATE_FORMAT } from '@constants/date';
import { sortDiagnosesByCertainty } from '@utils/diagnosis';
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
      { key: 'recorder', header: t('DIAGNOSIS_LIST_RECORDER') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'display', sortable: true },
      { key: 'recorder', sortable: true },
    ],
    [],
  );

  // Sort diagnoses within each date group by certainty: confirmed → provisional
  const sortedDiagnoses = useMemo(() => {
    return diagnoses.map((diagnosisByDate) => ({
      ...diagnosisByDate,
      diagnoses: sortDiagnosesByCertainty(diagnosisByDate.diagnoses),
    }));
  }, [diagnoses]);

  // Function to render cell content based on the cell ID
  const renderCell = (diagnosis: FormattedDiagnosis, cellId: string) => {
    switch (cellId) {
      case 'display':
        return (
          <>
            {diagnosis.display + ' '}
            <Tag
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
          </>
        );
      case 'recorder':
        return diagnosis.recorder || t('DIAGNOSIS_TABLE_NOT_AVAILABLE');
    }
  };

  return (
    <Tile
      title={t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}
      data-testid="diagnoses-accordion-item"
      className={styles.diagnosesTable}
    >
      <div className={styles.diagnosesTableTitle}>
        {t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}
      </div>
      {loading && (
        <DataTableSkeleton
          columnCount={2}
          rowCount={1}
          showHeader={false}
          showToolbar={false}
          compact
        />
      )}
      {error && (
        <p className={styles.diagnosesTableBodyError}>
          {t('ERROR_FETCHING_DIAGNOSES')}
        </p>
      )}
      {!loading && !error && diagnoses.length === 0 && (
        <p className={styles.diagnosesTableBodyError}>{t('NO_DIAGNOSES')}</p>
      )}
      {sortedDiagnoses.map((diagnosisByDate, index) => {
        const { date, diagnoses: diagnosisList } = diagnosisByDate;

        // Format the date for display
        const formattedDate =
          formatDate(date, FULL_MONTH_DATE_FORMAT).formattedResult || date;

        return (
          <ExpandableDataTable
            key={date}
            tableTitle={formattedDate}
            rows={diagnosisList}
            headers={headers}
            sortable={sortable}
            renderCell={renderCell}
            loading={false}
            error={null}
            ariaLabel={`${t('DIAGNOSES_DISPLAY_CONTROL_HEADING')} - ${formattedDate}`}
            emptyStateMessage={t('NO_DIAGNOSES')}
            className={styles.diagnosesTableBody}
            isOpen={index === 0} // Open the first item by default
          />
        );
      })}
    </Tile>
  );
};

export default DiagnosesTable;
