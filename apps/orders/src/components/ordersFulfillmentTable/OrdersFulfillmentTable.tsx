import { ExpandableSortableDataTable } from '@bahmni/design-system';
import {
  useTranslation,
  getObservationByConceptName,
  ObservationData,
  TabStatus,
} from '@bahmni/services';
import { DataTableHeader } from '@carbon/react';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  Fragment,
  useEffect,
} from 'react';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import {
  PatientOrderRow,
  OrderStatusConfig,
} from '../../models/orderFulfillment';
import { ORDER_PRIORITY } from '../../models/ordersConfig';
import useOrdersStore from '../../stores/ordersStore';
import { parseAgeYears } from '../../utils/patientUtils';
import { ExpandedOrderRow } from '../expandedOrderRow';
import LinkButton from '../linkButton/LinkButton';
import { NewBadge } from '../newBadge';
import { PriorityBadge } from '../priorityBadge';
import { StatusFilter } from '../statusFilter';
import customOrderTableStyles from './styles/CustomOrderTable.module.scss';
import styles from './styles/OrdersFulfillmentTable.module.scss';

interface OrdersFulfillmentTableProps {
  rows: PatientOrderRow[];
  headers: DataTableHeader[];
  loading?: boolean;
  isCustomOrderTab?: boolean;
  isSliderOpen?: boolean;
  contentScrollRef?: React.RefObject<HTMLDivElement | null>;
  onOrderClick?: (orderId: string) => void;
  searchTerm?: string;
  tabStatuses?: TabStatus;
  onPatientExpand?: (
    patientUuid: string,
    lmpData: ObservationData | null,
  ) => void;
}

export const OrdersFulfillmentTable: React.FC<OrdersFulfillmentTableProps> = ({
  rows,
  headers,
  loading = false,
  isCustomOrderTab = false,
  isSliderOpen = false,
  contentScrollRef,
  onOrderClick,
  searchTerm = '',
  tabStatuses,
  onPatientExpand,
}) => {
  const { t } = useTranslation();
  const { ordersTableConfig, tabs } = useOrdersConfig();
  const statusHeaderRef = useRef<HTMLSpanElement>(null);
  const rowAnchorRef = useRef<{
    orderId: string;
    rowTop: number;
  } | null>(null);
  const fetchedPatientUuids = useRef<Set<string>>(new Set());
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { selectedIndex } = useOrdersStore();

  const effectivePreSelected = (tabStatuses?.preSelected ??
    ordersTableConfig?.orderStatusesPreSelected ??
    []) as OrderStatusConfig[];

  const [selectedStatuses, setSelectedStatuses] =
    useState<OrderStatusConfig[]>(effectivePreSelected);

  const isSearchActive = searchTerm && searchTerm.trim().length >= 3;

  useEffect(() => {
    if (isSearchActive) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses(effectivePreSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchActive]);

  // Clear LMP fetch cache when orders refresh or tab changes
  useEffect(() => {
    fetchedPatientUuids.current = new Set();
  }, [rows, selectedIndex]);

  const handleStatusFilterApply = (statuses: OrderStatusConfig[]) => {
    setSelectedStatuses(statuses);
  };

  const toggleStatusFilter = useCallback(() => {
    setIsStatusFilterOpen(!isStatusFilterOpen);
  }, [isStatusFilterOpen]);

  const getOrderRowElement = useCallback((orderId: string) => {
    const escapedOrderId =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(orderId)
        : orderId;

    return document.querySelector(
      `[data-order-id="${escapedOrderId}"]`,
    ) as HTMLElement | null;
  }, []);

  const captureSelectedOrderRowPosition = useCallback(
    (orderId: string) => {
      const orderRow = getOrderRowElement(orderId);

      if (!orderRow) {
        rowAnchorRef.current = null;
        return;
      }

      rowAnchorRef.current = {
        orderId,
        rowTop: orderRow.getBoundingClientRect().top,
      };
    },
    [getOrderRowElement],
  );

  const restoreSelectedOrderRowPosition = useCallback(
    (orderId: string) => {
      const anchor = rowAnchorRef.current;

      if (anchor?.orderId !== orderId) {
        return;
      }

      const orderRow = getOrderRowElement(orderId);

      if (!orderRow) {
        return;
      }

      const currentRowTop = orderRow.getBoundingClientRect().top;
      const deltaTop = currentRowTop - anchor.rowTop;

      if (Math.abs(deltaTop) < 1) {
        return;
      }

      const scrollContainer = contentScrollRef?.current;

      if (!scrollContainer) {
        return;
      }

      scrollContainer.scrollTop += deltaTop;
      anchor.rowTop = orderRow.getBoundingClientRect().top;
    },
    [contentScrollRef, getOrderRowElement],
  );

  useEffect(() => {
    if (!selectedOrderId) {
      return;
    }

    restoreSelectedOrderRowPosition(selectedOrderId);
  }, [selectedOrderId, isSliderOpen, restoreSelectedOrderRowPosition]);

  useEffect(() => {
    if (isSliderOpen) {
      return;
    }

    setSelectedOrderId(null);
    rowAnchorRef.current = null;
  }, [isSliderOpen]);

  const getFilteredRows = () => {
    if (selectedStatuses.length === 0) {
      return rows;
    }

    if (isCustomOrderTab) {
      return rows;
    }

    const selectedStatusValues = selectedStatuses.map((s) => s.value);

    return rows
      .map((row) => {
        const filteredOrders = row.orders.filter((order) =>
          selectedStatusValues.includes(order.status),
        );

        if (filteredOrders.length === 0) {
          return null;
        }

        const urgentCount = filteredOrders.filter(
          (order) => order.priority === ORDER_PRIORITY.STAT,
        ).length;

        return {
          ...row,
          orders: filteredOrders,
          totalOrdersCount: filteredOrders.length,
          urgentCount,
        };
      })
      .filter((row): row is PatientOrderRow => row !== null);
  };

  const displayRows = getFilteredRows();

  const totalNewOrdersCount = useMemo(
    () => rows.reduce((sum, row) => sum + row.recentOrdersCount, 0),
    [rows],
  );

  const customHeaders = useMemo(() => {
    const availableStatuses: OrderStatusConfig[] = (tabStatuses?.available ??
      ordersTableConfig?.orderStatusesAvailable ??
      []) as OrderStatusConfig[];

    return headers.map((h) => {
      if (h.key === 'badge' && totalNewOrdersCount > 0) {
        return {
          ...h,
          header: (
            <div className={styles.centerAlignText}>
              <NewBadge count={totalNewOrdersCount} />
            </div>
          ),
        };
      }
      if (h.key === 'status') {
        return {
          ...h,
          header: (
            <span ref={statusHeaderRef} className={styles.statusHeader}>
              {h.header}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.statusCaret}
                aria-hidden="true"
                onClick={toggleStatusFilter}
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <StatusFilter
                availableStatuses={availableStatuses}
                selectedStatuses={selectedStatuses}
                onApply={handleStatusFilterApply}
                isOpen={isStatusFilterOpen}
                onToggle={toggleStatusFilter}
                anchorRef={statusHeaderRef}
              />
            </span>
          ),
        };
      }
      return h;
    });
  }, [
    ordersTableConfig,
    tabStatuses,
    headers,
    isStatusFilterOpen,
    selectedStatuses,
    toggleStatusFilter,
    totalNewOrdersCount,
  ]);

  const renderCell = (row: PatientOrderRow, cellId: string) => {
    switch (cellId) {
      case 'badge':
        return row.recentOrdersCount > 0 ? (
          <div className={styles.centerAlignText}>
            <NewBadge count={row.recentOrdersCount} />
          </div>
        ) : null;
      case 'identifier':
        return (
          <span
            className={
              isCustomOrderTab ? customOrderTableStyles.customOrderCell : ''
            }
          >
            <LinkButton
              forwardUrl={tabs[selectedIndex].forwardUrl}
              targetedTab={tabs[selectedIndex].targetedTab}
              id={row.id}
              className={styles.identifierLink}
            >
              {row.identifier}
            </LinkButton>
          </span>
        );
      case 'patientName':
        return isCustomOrderTab ? (
          <span className={customOrderTableStyles.customOrderCell}>
            {row.patientName}
          </span>
        ) : (
          row.patientName
        );
      case 'ordersPending':
        return row.totalOrdersCount;
      case 'hasBeenAdmitted':
        return (
          <span className={row.hasBeenAdmitted ? styles.ipdBedIndication : ''}>
            {row.hasBeenAdmitted ? (
              <FontAwesomeIcon icon={faBed} data-testid="bed-icon" />
            ) : (
              ''
            )}
          </span>
        );
      case 'priority':
        return (
          <div className={styles.priorityCell}>
            {row.urgentCount > 0 ? (
              <PriorityBadge priority="Urgent" count={row.urgentCount} />
            ) : null}
          </div>
        );
      case 'status':
        return null;
      case 'provider':
      case 'dateTime':
      case 'owner':
        return null;
      default:
        return null;
    }
  };

  const renderExpandedContent = (row: PatientOrderRow) => {
    const { lmpConfig } = ordersTableConfig ?? {};
    const lmpDateConcept = lmpConfig?.lmpDateConcept;
    const lmpTabLabels = lmpConfig?.tabLabels;
    const patientUuid = row.orders[0]?.patientUuid;
    const patient = row.orders[0]?.patient;
    const currentTabLabel = tabs?.[selectedIndex]?.label;

    const shouldFetchLmp = !!(
      lmpConfig &&
      patient?.gender === 'F' &&
      parseAgeYears(patient?.age) >= 10 &&
      (!lmpTabLabels?.length || lmpTabLabels.includes(currentTabLabel)) &&
      patientUuid
    );

    if (shouldFetchLmp) {
      if (!fetchedPatientUuids.current.has(patientUuid!)) {
        fetchedPatientUuids.current.add(patientUuid!);
        setTimeout(() => {
          getObservationByConceptName(patientUuid!, lmpDateConcept!)
            .then((result) => {
              onPatientExpand?.(patientUuid!, result as ObservationData | null);
            })
            .catch(() => {
              onPatientExpand?.(patientUuid!, null);
            });
        }, 0);
      }
    }

    return (
      <Fragment>
        {row.orders.map((order) => (
          <ExpandedOrderRow
            key={order.id}
            order={order}
            isSelected={selectedOrderId === order.id}
            onOrderClick={(orderId) => {
              captureSelectedOrderRowPosition(orderId);
              setSelectedOrderId(orderId);
              onOrderClick?.(orderId);
            }}
          />
        ))}
      </Fragment>
    );
  };

  if (isCustomOrderTab) {
    return (
      <ExpandableSortableDataTable
        headers={customHeaders}
        rows={displayRows.map((row) => ({ ...row, isExpandable: false }))}
        ariaLabel={t('ORDERS_FULFILLMENT_TABLE')}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        emptyStateMessage={t('NO_ORDERS_FOUND')}
        className={`${styles.ordersTable} ${customOrderTableStyles.customOrderTable}`}
        showExpandAll={false}
      />
    );
  }

  return (
    <ExpandableSortableDataTable
      headers={customHeaders}
      rows={displayRows}
      ariaLabel={t('ORDERS_FULFILLMENT_TABLE')}
      renderCell={renderCell}
      renderExpandedContent={renderExpandedContent}
      loading={loading}
      emptyStateMessage={t('NO_ORDERS_FOUND')}
      className={styles.ordersTable}
    />
  );
};
