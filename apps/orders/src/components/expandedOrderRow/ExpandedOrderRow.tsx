import { Link } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { Order } from '../../models/orderFulfillment';
import { PriorityBadge } from '../priorityBadge';
import styles from './styles/ExpandedOrderRow.module.scss';

interface ExpandedOrderRowProps {
  order: Order;
  onOrderClick?: (orderId: string) => void;
}

export const ExpandedOrderRow: React.FC<ExpandedOrderRowProps> = ({
  order,
  onOrderClick,
}) => {
  const { t } = useTranslation();

  const handleOrderClick = () => {
    onOrderClick?.(order.id);
  };

  return (
    <tr className={styles.expandedOrderRow} data-testid="expanded-order-row">
      <td />
      <td />
      <td />
      <td />
      <td className={styles.orderNameCell}>
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
      </td>
      <td>
        <PriorityBadge priority={order.priority} />
      </td>
      <td className={styles.statusCell}>{order.status}</td>
      <td className={styles.providerCell}>{order.provider}</td>
      <td className={styles.dateTimeCell}>{order.dateTime}</td>
      <td className={styles.ownerCell}>
        {order.owner ?? (
          <span className={styles.unassigned}>{t('UNASSIGNED')}</span>
        )}
      </td>
    </tr>
  );
};
