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
    <div className={styles.expandedOrderRow} data-testid="expanded-order-row">
      <div className={styles.emptyCell} />
      <div className={styles.emptyCell} />
      <div className={styles.identifierCell}>{order.identifier}</div>
      <div className={styles.patientNameCell}>{order.patientName}</div>
      <div className={styles.orderNameCell}>
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
      </div>
      <div className={styles.priorityCell}>
        <PriorityBadge priority={order.priority} />
      </div>
      <div className={styles.statusCell}>{order.status}</div>
      <div className={styles.providerCell}>{order.provider}</div>
      <div className={styles.dateTimeCell}>{order.dateTime}</div>
      <div className={styles.ownerCell}>
        {order.owner ?? (
          <span className={styles.unassigned}>{t('UNASSIGNED')}</span>
        )}
      </div>
    </div>
  );
};
