import { useTranslation } from '@bahmni/services';
import React from 'react';
import styles from './styles/NewBadge.module.scss';

interface NewBadgeProps {
  count: number;
}

export const NewBadge: React.FC<NewBadgeProps> = ({ count }) => {
  const { t } = useTranslation();

  if (count <= 0) {
    return null;
  }

  return (
    <span className={styles.newBadge} data-testid="new-badge">
      {count} {t('NEW')}
    </span>
  );
};
