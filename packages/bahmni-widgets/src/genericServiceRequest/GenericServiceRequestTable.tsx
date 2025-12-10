import { SortableDataTable } from '@bahmni/design-system';
import {
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  formatDate,
  getFormattedError,
  getOrderTypes,
  getServiceRequests,
  groupByDate,
  useTranslation,
} from '@bahmni/services';
import { Accordion, AccordionItem, Tag } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo } from 'react';

import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { ServiceRequestViewModel } from './models';
import styles from './styles/GenericServiceRequestTable.module.scss';
import {
  createServiceRequestViewModels,
  filterServiceRequestReplacementEntries,
  sortServiceRequestsByPriority,
} from './utils';

export const orderTypesQueryKeys = () => ['orderTypes'] as const;

export const genericServiceRequestQueryKeys = (
  categoryUuid: string,
  patientUUID: string,
) => ['genericServiceRequest', categoryUuid, patientUUID] as const;

const fetchServiceRequests = async (
  categoryUuid: string,
  patientUUID: string,
): Promise<ServiceRequestViewModel[]> => {
  const response = await getServiceRequests(categoryUuid, patientUUID);
  return createServiceRequestViewModels(response);
};

/**
 * Component to display patient service requests grouped by date in accordion format
 * Each accordion item contains a SortableDataTable with service requests for that date
 */
const GenericServiceRequestTable: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const categoryName = (config?.category as string) || '';

  // Fetch order types to get the category UUID
  const {
    data: orderTypesData,
    isLoading: isLoadingOrderTypes,
    isError: isOrderTypesError,
    error: orderTypesError,
  } = useQuery({
    queryKey: orderTypesQueryKeys(),
    queryFn: getOrderTypes,
  });

  // Find the category UUID from the category name
  const categoryUuid = useMemo(() => {
    if (!orderTypesData || !categoryName) return '';
    const orderType = orderTypesData.results.find(
      (ot) => ot.display.toLowerCase() === categoryName.toLowerCase(),
    );
    return orderType?.uuid ?? '';
  }, [orderTypesData, categoryName]);

  // Fetch service requests using the category UUID
  const {
    data,
    isLoading: isLoadingServiceRequests,
    isError: isServiceRequestsError,
    error: serviceRequestsError,
  } = useQuery({
    queryKey: genericServiceRequestQueryKeys(categoryUuid, patientUUID!),
    enabled: !!patientUUID && !!categoryUuid,
    queryFn: () => fetchServiceRequests(categoryUuid, patientUUID!),
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
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'testName', sortable: true },
      { key: 'orderedBy', sortable: true },
    ],
    [],
  );

  const processedServiceRequests = useMemo(() => {
    const filteredRequests =
      filterServiceRequestReplacementEntries(serviceRequests);

    const grouped = groupByDate(
      filteredRequests,
      (request: ServiceRequestViewModel) => {
        const result = formatDate(request.orderedDate, t, ISO_DATE_FORMAT);
        return result.formattedResult;
      },
    );

    const groupedData = grouped.map((group) => ({
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
              <p className={styles.requestName}>{request.testName}</p>
              {request.priority === 'stat' && (
                <Tag type="red">{t('SERVICE_REQUEST_PRIORITY_URGENT')}</Tag>
              )}
            </>
          );
        case 'orderedBy':
          return request.orderedBy;
        default:
          return null;
      }
    },
    [t],
  );

  return (
    <div data-testid="generic-service-request-table">
      {isLoading || !!isError || processedServiceRequests.length === 0 ? (
        <SortableDataTable
          headers={headers}
          ariaLabel={t('SERVICE_REQUEST_HEADING')}
          rows={[]}
          loading={isLoading}
          errorStateMessage={isError ? error?.message : undefined}
          emptyStateMessage={t('NO_SERVICE_REQUESTS')}
          renderCell={renderCell}
          className={styles.serviceRequestTableBody}
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
                data-testid={'accordian-table-title'}
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
