import { Link } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { TableRow, TableCell } from '@carbon/react';
import React from 'react';
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
        <Link
          href="#"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            handleOrderClick();
          }}
          className={styles.orderLink}
        >
          {order.orderName}
        </Link>
      </TableCell>
      <TableCell className={styles.priority}>
        <PriorityBadge priority={order.priority} />
      </TableCell>
      <TableCell className={styles.statusCell}>{order.status}</TableCell>
      <TableCell className={styles.providerCell}>{order.provider}</TableCell>
      <TableCell className={styles.dateTimeCell}>{order.dateTime}</TableCell>
      <TableCell className={styles.ownerCell}>
        {order.owner ?? (
          <span className={styles.unassigned}>{t('UNASSIGNED')}</span>
        )}
      </TableCell>
      <TableCell />
    </TableRow>
  );
};
