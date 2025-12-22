import { SortableDataTable, TooltipIcon } from '@bahmni/design-system';
import {
  RadiologyInvestigation,
  useTranslation,
  groupByDate,
  formatDate,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
} from '@bahmni/services';
import { Tag, Accordion, AccordionItem } from '@carbon/react';
import React, { useMemo, useCallback } from 'react';
import styles from './styles/RadiologyInvestigationTable.module.scss';
import { useRadiologyInvestigation } from './useRadiologyInvestigation';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from './utils';

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
      const result = formatDate(investigation.orderedDate, t, ISO_DATE_FORMAT);
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
                <span>{investigation.testName}</span>
                {investigation.note && (
                  <TooltipIcon
                    iconName="fa-file-lines"
                    content={investigation.note}
                    ariaLabel={investigation.note}
                  />
                )}
              </p>
              {investigation.priority === 'stat' && (
                <Tag type="red">{t('RADIOLOGY_PRIORITY_URGENT')}</Tag>
              )}
            </>
          );
        case 'results':
          return '--';
        case 'orderedBy':
          return investigation.orderedBy;
        default:
          return null;
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
              t,
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
