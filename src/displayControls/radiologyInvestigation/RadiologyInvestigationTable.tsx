import { Tag, Accordion, AccordionItem } from '@carbon/react';
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableDataTable } from '@/components/common/sortableDataTable/SortableDataTable';
import { FULL_MONTH_DATE_FORMAT, ISO_DATE_FORMAT } from '@constants/date';
import { useRadiologyInvestigation } from '@hooks/useRadiologyInvestigation';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import { groupByDate } from '@utils/common';
import { formatDate } from '@utils/date';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from '@utils/radiologyInvestigation';
import * as styles from './styles/RadiologyInvestigationTable.module.scss';

/**
 * Component to display patient radiology investigations grouped by date in accordion format
 * Each accordion item contains an SortableDataTable with radiology investigations for that date
 */
const RadiologyInvestigationTable: React.FC = () => {
  const { t } = useTranslation();
  const { radiologyInvestigations, loading, error } =
    useRadiologyInvestigation();

  const headers = useMemo(
    () => [
      { key: 'testName', header: t('RADIOLOGY_TEST_NAME') },
      { key: 'results', header: t('RADIOLOGY_RESULTS') },
      { key: 'orderedBy', header: t('RADIOLOGY_ORDERED_BY') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'testName', sortable: true },
      { key: 'results', sortable: true },
      { key: 'orderedBy', sortable: true },
    ],
    [],
  );

  const processedInvestigations = useMemo(() => {
    const filteredInvestigations = filterRadiologyInvestionsReplacementEntries(
      radiologyInvestigations,
    );

    const grouped = groupByDate(filteredInvestigations, (investigation) => {
      const result = formatDate(investigation.orderedDate, ISO_DATE_FORMAT);
      return result.formattedResult;
    });

    const groupedData = grouped.map((group) => ({
      date: group.date,
      investigations: group.items,
    }));

    return groupedData.map((investigationsByDate) => ({
      ...investigationsByDate,
      investigations: sortRadiologyInvestigationsByPriority(
        investigationsByDate.investigations,
      ),
    }));
  }, [radiologyInvestigations]);

  const renderCell = useCallback(
    (investigation: RadiologyInvestigation, cellId: string) => {
      switch (cellId) {
        case 'testName':
          return (
            <>
              <p className={styles.investigationName}>
                {investigation.testName}
              </p>
              {investigation.priority === 'stat' && (
                <Tag className={styles.urgentCell}>
                  {t('RADIOLOGY_PRIORITY_URGENT')}
                </Tag>
              )}
            </>
          );
        case 'results':
          return '--';
        case 'orderedBy':
          return investigation.orderedBy;
      }
    },
    [t],
  );

  return (
    <div data-testid="radiology-investigations-table">
      {loading || !!error || processedInvestigations.length === 0 ? (
        <SortableDataTable
          headers={headers}
          ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
          rows={[]}
          loading={loading}
          errorStateMessage={error?.message}
          emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
          renderCell={renderCell}
          className={styles.radiologyInvestigationTableBody}
        />
      ) : (
        <Accordion align="start">
          {processedInvestigations.map((investigationsByDate, index) => {
            const { date, investigations } = investigationsByDate;
            const formattedDate = formatDate(
              date,
              FULL_MONTH_DATE_FORMAT,
            ).formattedResult;

            return (
              <AccordionItem
                title={formattedDate}
                key={date}
                className={styles.customAccordianItem}
                data-testid={'accordian-table-title'}
                open={index === 0}
              >
                <SortableDataTable
                  headers={headers}
                  ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
                  rows={investigations}
                  loading={loading}
                  errorStateMessage={''}
                  sortable={sortable}
                  emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
                  renderCell={renderCell}
                  className={styles.radiologyInvestigationTableBody}
                />
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default RadiologyInvestigationTable;
