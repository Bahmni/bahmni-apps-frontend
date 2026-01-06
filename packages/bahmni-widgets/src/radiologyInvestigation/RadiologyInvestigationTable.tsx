import {
  SortableDataTable,
  TooltipIcon,
  Tag,
  Accordion,
  AccordionItem,
} from '@bahmni/design-system';
import {
  RadiologyInvestigation,
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
import React, { useMemo, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import styles from './styles/RadiologyInvestigationTable.module.scss';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from './utils';

/**
 * Component to display patient radiology investigations grouped by date in accordion format
 * Each accordion item contains an SortableDataTable with radiology investigations for that date
 */
const RadiologyInvestigationTable: React.FC<WidgetProps> = ({
  config,
  encounterUuids,
  episodeOfCareUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
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
  });

  const categoryUuid = useMemo(() => {
    if (!orderTypesData || !categoryName) return '';
    const orderType = orderTypesData.results.find(
      (ot) => ot.display.toLowerCase() === categoryName.toLowerCase(),
    );
    return orderType?.uuid ?? '';
  }, [orderTypesData, categoryName]);

  const {
    data: radiologyInvestigations,
    isLoading: isLoadingRadiologyInvestigations,
    isError: isRadiologyInvestigationsError,
    error: radiologyInvestigationsError,
  } = useQuery<RadiologyInvestigation[]>({
    queryKey: [
      'radiologyInvestigations',
      categoryUuid,
      patientUUID,
      encounterUuids,
      numberOfVisits,
    ],
    enabled: !!patientUUID && !!categoryUuid && !emptyEncounterFilter,
    queryFn: () =>
      getPatientRadiologyInvestigations(
        patientUUID!,
        categoryUuid,
        encounterUuids,
        numberOfVisits,
      ),
  });

  useEffect(() => {
    if (isOrderTypesError) {
      const { message } = getFormattedError(orderTypesError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
    if (isRadiologyInvestigationsError) {
      const { message } = getFormattedError(radiologyInvestigationsError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
  }, [
    isOrderTypesError,
    orderTypesError,
    isRadiologyInvestigationsError,
    radiologyInvestigationsError,
    addNotification,
    t,
  ]);

  const loading = isLoadingOrderTypes || isLoadingRadiologyInvestigations;
  const hasError = isOrderTypesError || isRadiologyInvestigationsError;

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

  if (hasError) {
    return (
      <div
        className={styles.radiologyInvestigationTableBodyError}
        data-testid="radiology-investigations-table"
      >
        {t('RADIOLOGY_ERROR_LOADING')}
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="radiology-investigations-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
          rows={[]}
          loading
          errorStateMessage={''}
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
                loading={false}
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
    </div>
  );
};

export default RadiologyInvestigationTable;
