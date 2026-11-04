import { useTranslation } from '@bahmni/services';
import { TableRow, TableCell } from '@carbon/react';
import React from 'react';
import { UI_STATUS_TO_TRANSLATION_KEY } from '../../constants/orderStatusMappings';
import { Order } from '../../models/orderFulfillment';
import { PriorityBadge } from '../priorityBadge';
import styles from './styles/ExpandedOrderRow.module.scss';

interface ExpandedOrderRowProps {
  order: Order;
  onOrderClick?: (orderId: string) => void;
  isSelected?: boolean;
}

export const ExpandedOrderRow: React.FC<ExpandedOrderRowProps> = ({
  order,
  onOrderClick,
  isSelected,
}) => {
  const { t } = useTranslation();

  const handleOrderClick = () => {
    onOrderClick?.(order.id);
  };

  return (
    <TableRow
      className={`${styles.expandedOrderRow} ${
        isSelected ? styles.selectedChildRow : ''
      }`}
      data-testid="expanded-order-row"
      data-order-id={order.id}
    >
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell className={styles.orderNameCell}>
        <button
          type="button"
          onClick={handleOrderClick}
          className={styles.orderLink}
        >
          {order.orderName}
        </button>
      </TableCell>
      <TableCell className={styles.priority}>
        <PriorityBadge priority={order.priority} />
      </TableCell>
      <TableCell className={styles.statusCell}>
        {t(UI_STATUS_TO_TRANSLATION_KEY[order.status] ?? order.status)}
      </TableCell>
      <TableCell className={styles.providerCell}>
        {order.provider?.display ?? '-'}
      </TableCell>
      <TableCell className={styles.dateTimeCell}>{order.dateTime}</TableCell>
      <TableCell className={styles.ownerCell}>
        {order.owner?.display ?? (
          <span className={styles.unassigned}>{t('UNASSIGNED')}</span>
        )}
      </TableCell>
      <TableCell />
    </TableRow>
  );
};
