import {
  SortableDataTable,
  TooltipIcon,
  Accordion,
  AccordionItem,
  Tag,
} from '@bahmni/design-system';
import {
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  formatDate,
  getFormattedError,
  getCategoryUuidFromOrderTypes,
  getServiceRequests,
  groupByDate,
  shouldEnableEncounterFilter,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo } from 'react';

import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { ServiceRequestViewModel } from './models';
import styles from './styles/GenericServiceRequestTable.module.scss';
import { mapServiceRequest, sortServiceRequestsByPriority } from './utils';

export const genericServiceRequestQueryKeys = (
  categoryUuid: string,
  patientUUID: string,
  encounterUuids?: string[],
) =>
  ['genericServiceRequest', categoryUuid, patientUUID, encounterUuids] as const;

const fetchServiceRequests = async (
  categoryUuid: string,
  patientUUID: string,
  encounterUuids?: string[],
): Promise<ServiceRequestViewModel[]> => {
  const response = await getServiceRequests(
    categoryUuid,
    patientUUID,
    encounterUuids,
  );
  return mapServiceRequest(response);
};

/**
 * Component to display patient service requests grouped by date in accordion format
 * Each accordion item contains a SortableDataTable with service requests for that date
 */
const GenericServiceRequestTable: React.FC<WidgetProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
  visitUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const categoryName = (config?.orderType as string) || '';

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: categoryUuid,
    isLoading: isLoadingOrderTypes,
    isError: isOrderTypesError,
    error: orderTypesError,
  } = useQuery({
    queryKey: ['categoryUuid', categoryName],
    queryFn: () => getCategoryUuidFromOrderTypes(categoryName),
    enabled: !!categoryName,
  });

  const {
    data,
    isLoading: isLoadingServiceRequests,
    isError: isServiceRequestsError,
    error: serviceRequestsError,
  } = useQuery({
    queryKey: genericServiceRequestQueryKeys(
      categoryUuid,
      patientUUID!,
      encounterUuids,
    ),
    enabled: !!patientUUID && !!categoryUuid,
    queryFn: () =>
      fetchServiceRequests(categoryUuid, patientUUID!, encounterUuids),
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
    if (isServiceRequestsError) {
      const { message } = getFormattedError(serviceRequestsError);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    }
  }, [
    isOrderTypesError,
    orderTypesError,
    isServiceRequestsError,
    serviceRequestsError,
    addNotification,
    t,
  ]);

  const serviceRequests = data ?? [];
  const isLoading = isLoadingOrderTypes || isLoadingServiceRequests;
  const isError = isOrderTypesError || isServiceRequestsError;
  const error = orderTypesError ?? serviceRequestsError;

  const headers = useMemo(
    () => [
      { key: 'testName', header: t('SERVICE_REQUEST_TEST_NAME') },
      { key: 'orderedBy', header: t('SERVICE_REQUEST_ORDERED_BY') },
      { key: 'status', header: t('SERVICE_REQUEST_ORDERED_STATUS') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'testName', sortable: true },
      { key: 'orderedBy', sortable: true },
      { key: 'status', sortable: true },
    ],
    [],
  );

  const processedServiceRequests = useMemo(() => {
    //TODO : Need to check this filteration;
    // const filteredRequests =
    //   filterServiceRequestReplacementEntries(serviceRequests);

    const grouped = groupByDate(
      serviceRequests,
      (request: ServiceRequestViewModel) => {
        const result = formatDate(request.orderedDate, t, ISO_DATE_FORMAT);
        return result.formattedResult;
      },
    );

    const sortedGroups = grouped.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const groupedData = sortedGroups.map((group) => ({
      date: group.date,
      requests: group.items,
    }));

    return groupedData.map((requestsByDate) => ({
      ...requestsByDate,
      requests: sortServiceRequestsByPriority(requestsByDate.requests),
    }));
  }, [serviceRequests, t]);

  const renderCell = useCallback(
    (request: ServiceRequestViewModel, cellId: string) => {
      switch (cellId) {
        case 'testName':
          return (
            <>
              <p className={styles.requestName}>
                <span>{request.testName}</span>
                {request.note && (
                  <TooltipIcon
                    iconName="fa-file-lines"
                    content={request.note}
                    ariaLabel={request.note}
                  />
                )}
              </p>
              {request.priority === 'stat' && (
                <Tag type="red">{t('SERVICE_REQUEST_PRIORITY_URGENT')}</Tag>
              )}
            </>
          );
        case 'orderedBy':
          return request.orderedBy;
        case 'status':
          return (
            <>
              {request.status === 'active' && (
                <Tag type="outline">{t('IN_PROGRESS_STATUS')}</Tag>
              )}
              {request.status === 'completed' && (
                <Tag type="outline">{t('COMPLETED_STATUS')}</Tag>
              )}
              {request.status === 'revoked' && (
                <Tag type="outline">{t('REVOKED_STATUS')}</Tag>
              )}
              {request.status === 'unknown' && (
                <Tag type="outline">{t('UNKNOWN_STATUS')}</Tag>
              )}
            </>
          );

        default:
          return null;
      }
    },
    [t],
  );

  return (
    <div data-testid="generic-service-request-table">
      {isLoading ||
      !!isError ||
      processedServiceRequests.length === 0 ||
      emptyEncounterFilter ? (
        <SortableDataTable
          headers={headers}
          ariaLabel={t('SERVICE_REQUEST_HEADING')}
          rows={[]}
          loading={isLoading}
          errorStateMessage={isError ? error?.message : undefined}
          emptyStateMessage={t('NO_SERVICE_REQUESTS')}
          renderCell={renderCell}
          className={styles.serviceRequestTableBody}
          data-testid="sortable-data-table"
        />
      ) : (
        <Accordion align="start">
          {processedServiceRequests.map((requestsByDate, index) => {
            const { date, requests } = requestsByDate;
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
                  ariaLabel={t('SERVICE_REQUEST_HEADING')}
                  rows={requests}
                  loading={isLoading}
                  errorStateMessage={''}
                  sortable={sortable}
                  emptyStateMessage={t('NO_SERVICE_REQUESTS')}
                  renderCell={renderCell}
                  className={styles.serviceRequestTableBody}
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

export default GenericServiceRequestTable;
