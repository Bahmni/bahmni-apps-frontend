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
  shouldEnableEncounterFilter,
  getOrderTypes,
  ORDER_TYPE_QUERY_KEY,
  getFormattedError,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
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
  category: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<RadiologyInvestigationViewModel[]> => {
  const response = await getPatientRadiologyInvestigations(
    patientUUID!,
    category,
    encounterUuids,
    numberOfVisits,
  );
  return createRadiologyInvestigationViewModels(response);
};

/**
 * Component to display patient radiology investigations grouped by date in accordion format
 * Each accordion item contains an SortableDataTable with radiology investigations for that date
 */
const RadiologyInvestigationTable: React.FC<WidgetProps> = ({
  config,
  encounterUuids,
  episodeOfCareUuids,
}) => {
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const categoryName = config?.orderType as string;
  const numberOfVisits = config?.numberOfVisits as number;

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: orderTypesData,
    isLoading: isLoadingOrderTypes,
    isError: isOrderTypesError,
    error: orderTypesError,
  } = useQuery({
    queryKey: ORDER_TYPE_QUERY_KEY,
    queryFn: getOrderTypes,
    enabled: !!categoryName,
  });

  const categoryUuid = useMemo(() => {
    if (!orderTypesData || !categoryName) return '';
    const orderType = orderTypesData.results.find(
      (ot) => ot.display.toLowerCase() === categoryName.toLowerCase(),
    );
    return orderType?.uuid ?? '';
  }, [orderTypesData, categoryName]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: radiologyInvestigationQueryKeys(patientUUID!),
    enabled: !!patientUUID && !!categoryUuid && !emptyEncounterFilter,
    queryFn: () =>
      fetchRadiologyInvestigations(
        patientUUID!,
        categoryUuid,
        encounterUuids,
        numberOfVisits,
      ),
  });

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

  const loading = isLoading || isLoadingOrderTypes;
  const errorMessage =
    isError && error
      ? getFormattedError(error).message
      : isOrderTypesError && orderTypesError
        ? getFormattedError(orderTypesError).message
        : '';
  const hasError = isError || isOrderTypesError;

  useEffect(() => {
    if (hasError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: errorMessage,
        type: 'error',
      });
  }, [hasError, errorMessage]);

  const processedInvestigations = useMemo(() => {
    const filteredInvestigations = filterRadiologyInvestionsReplacementEntries(
      data ?? [],
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
  }, [data]);

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
      {loading || !!hasError || processedInvestigations.length === 0 ? (
        <SortableDataTable
          headers={headers}
          ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
          rows={[]}
          loading={loading}
          errorStateMessage={errorMessage}
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
