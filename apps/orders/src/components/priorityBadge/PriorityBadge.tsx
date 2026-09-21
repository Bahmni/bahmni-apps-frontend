import { useTranslation } from '@bahmni/services';
import React from 'react';
import { OrderPriority } from '../../models/orderFulfillment';
import styles from './styles/PriorityBadge.module.scss';

interface PriorityBadgeProps {
  priority: OrderPriority;
  count?: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  count,
}) => {
  const { t } = useTranslation();

  if (priority !== 'Urgent' && priority !== 'STAT') {
    return null;
  }

  const displayText =
    count !== undefined && count > 0 ? `${count} ${t('URGENT')}` : t('URGENT');

  return (
    <span className={styles.priorityBadge} data-testid="priority-badge">
      {displayText}
    </span>
  );
};
