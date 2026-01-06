import {
  SortableDataTable,
  TooltipIcon,
  Tag,
  Accordion,
  AccordionItem,
} from '@bahmni/design-system';
import {
  getPatientRadiologyInvestigations,
  useTranslation,
  groupByDate,
  formatDate,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  getOrderTypes,
  ORDER_TYPE_QUERY_KEY,
  getPatientRadiologyInvestigations,
  shouldEnableEncounterFilter,
  getFormattedError,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { RadiologyInvestigationViewModel } from './models';
import styles from './styles/RadiologyInvestigationTable.module.scss';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
  createRadiologyInvestigationViewModels,
} from './utils';

export const radiologyInvestigationQueryKeys = (patientUUID: string) =>
  ['radiologyInvestigation', patientUUID] as const;

const fetchRadiologyInvestigations = async (
  patientUUID: string,
): Promise<RadiologyInvestigationViewModel[]> => {
  const response = await getPatientRadiologyInvestigations(patientUUID!);
  return createRadiologyInvestigationViewModels(response);
};

/**
 * Component to display patient radiology investigations grouped by date in accordion format
 * Each accordion item contains an SortableDataTable with radiology investigations for that date
 */
const RadiologyInvestigationTable: React.FC = () => {
  const [radiologyInvestigations, setRadiologyInvestigations] = useState<
    RadiologyInvestigationViewModel[]
  >([]);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: radiologyInvestigationQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => fetchRadiologyInvestigations(patientUUID!),
  });

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    if (data) setRadiologyInvestigations(data);
  }, [data, isLoading, isError, error]);

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
    const investigations = radiologyInvestigations ?? [];
    const filteredInvestigations =
      filterRadiologyInvestionsReplacementEntries(investigations);

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
  }, [radiologyInvestigations, t]);

  const renderCell = useCallback(
    (investigation: RadiologyInvestigationViewModel, cellId: string) => {
      switch (cellId) {
        case 'testName':
          return (
            <div
              id={`${investigation.id}-test-name`}
              data-testid={`${investigation.id}-test-name-test-id`}
            >
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
                <Tag
                  id={`${investigation.id}-priority`}
                  testId={`${investigation.id}-priority-test-id`}
                  type="red"
                >
                  {t('RADIOLOGY_PRIORITY_URGENT')}
                </Tag>
              )}
            </div>
          );
        case 'results':
          return (
            <span
              id={`${investigation.id}-results`}
              data-testid={`${investigation.id}-results-test-id`}
            >
              --
            </span>
          );
        case 'orderedBy':
          return (
            <span
              id={`${investigation.id}-ordered-by`}
              data-testid={`${investigation.id}-ordered-by-test-id`}
            >
              {investigation.orderedBy}
            </span>
          );
      }
    },
    [t],
  );

  return (
    <div
      id="radiology-investigations-table"
      data-testid="radiology-investigations-table-test-id"
      aria-label="radiology-investigations-table-aria-label"
    >
      {isLoading || !!error || processedInvestigations.length === 0 ? (
        <SortableDataTable
          headers={headers}
          ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
          rows={[]}
          loading={isLoading}
          errorStateMessage={error?.message}
          emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
          renderCell={renderCell}
          className={styles.radiologyInvestigationTableBody}
          data-testid="sortable-data-table"
        />
      </div>
    );
  }

  if (
    !loading &&
    (processedInvestigations.length === 0 || emptyEncounterFilter)
  ) {
    return (
      <div
        className={styles.radiologyInvestigationTableBodyError}
        data-testid="radiology-investigations-table"
      >
        {t('NO_RADIOLOGY_INVESTIGATIONS')}
      </div>
    );
  }

  return (
    <div data-testid="radiology-investigations-table">
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
                testId={'accordian-table-title'}
                open={index === 0}
              >
                <SortableDataTable
                  headers={headers}
                  ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
                  rows={investigations}
                  loading={isLoading}
                  errorStateMessage={''}
                  sortable={sortable}
                  emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
                  renderCell={renderCell}
                  className={styles.radiologyInvestigationTableBody}
                  data-testid="sortable-data-table"
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
