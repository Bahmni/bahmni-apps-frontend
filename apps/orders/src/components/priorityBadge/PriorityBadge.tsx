import { useTranslation } from '@bahmni/services';
import React from 'react';
import { ORDER_PRIORITY } from '../../models/ordersConfig';
import styles from './styles/PriorityBadge.module.scss';

interface PriorityBadgeProps {
  priority: ORDER_PRIORITY;
  count?: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  count,
}) => {
  const { t } = useTranslation();

  if (priority !== ORDER_PRIORITY.STAT) {
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
