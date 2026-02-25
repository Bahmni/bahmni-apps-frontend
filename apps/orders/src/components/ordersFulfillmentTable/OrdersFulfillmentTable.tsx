import { ExpandableSortableDataTable } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { DataTableHeader } from '@carbon/react';
import React, { useMemo, useState, useRef, useCallback, Fragment } from 'react';
import { useOrdersConfig } from '../../hooks/useOrdersConfig';
import {
  PatientOrderRow,
  OrderStatusConfig,
} from '../../models/orderFulfillment';
import useOrdersStore from '../../stores/ordersStore';
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
  onOrderClick?: (orderId: string) => void;
}

export const OrdersFulfillmentTable: React.FC<OrdersFulfillmentTableProps> = ({
  rows,
  headers,
  loading = false,
  isCustomOrderTab = false,
  onOrderClick,
}) => {
  const { t } = useTranslation();
  const { ordersTableConfig, tabs } = useOrdersConfig();
  const statusHeaderRef = useRef<HTMLSpanElement>(null);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { selectedIndex } = useOrdersStore();

  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatusConfig[]>(
    (ordersTableConfig?.orderStatusesPreSelected as OrderStatusConfig[]) ?? [],
  );

  const handleStatusFilterApply = (statuses: OrderStatusConfig[]) => {
    setSelectedStatuses(statuses);
  };

  const toggleStatusFilter = useCallback(() => {
    setIsStatusFilterOpen(!isStatusFilterOpen);
  }, [isStatusFilterOpen]);

  const customHeaders = useMemo(() => {
    const availableStatuses: OrderStatusConfig[] =
      (ordersTableConfig?.orderStatusesAvailable as OrderStatusConfig[]) ?? [];

    return headers.map((h) =>
      h.key === 'status'
        ? {
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
          }
        : h,
    );
  }, [
    ordersTableConfig,
    headers,
    isStatusFilterOpen,
    selectedStatuses,
    toggleStatusFilter,
  ]);

  const renderCell = (row: PatientOrderRow, cellId: string) => {
    switch (cellId) {
      case 'badge':
        return row.recentOrdersCount > 0 ? (
          <NewBadge count={row.recentOrdersCount} />
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

  const renderExpandedContent = (row: PatientOrderRow) => (
    <Fragment>
      {row.orders.map((order) => (
        <ExpandedOrderRow
          key={order.id}
          order={order}
          isSelected={selectedOrderId === order.id}
          onOrderClick={(orderId) => {
            setSelectedOrderId(orderId);
            onOrderClick?.(orderId);
          }}
        />
      ))}
    </Fragment>
  );

  if (isCustomOrderTab) {
    return (
      <ExpandableSortableDataTable
        headers={customHeaders}
        rows={rows.map((row) => ({ ...row, isExpandable: false }))}
        ariaLabel={t('ORDERS_FULFILLMENT_TABLE')}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        emptyStateMessage={t('NO_ORDERS_FOUND')}
        className={`${styles.ordersTable} ${customOrderTableStyles.customOrderTable}`}
      />
    );
  }

  return (
    <ExpandableSortableDataTable
      headers={customHeaders}
      rows={rows}
      ariaLabel={t('ORDERS_FULFILLMENT_TABLE')}
      renderCell={renderCell}
      renderExpandedContent={renderExpandedContent}
      loading={loading}
      emptyStateMessage={t('NO_ORDERS_FOUND')}
      className={styles.ordersTable}
    />
  );
};
