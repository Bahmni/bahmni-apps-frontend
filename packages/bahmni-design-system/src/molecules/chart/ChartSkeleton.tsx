import { CodeSnippetSkeleton } from '@carbon/react';
import React from 'react';
import styles from './styles/Chart.module.scss';
import './style';

export interface ChartSkeletonProps {
  ariaLabel?: string;
  testId?: string;
  className?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  ariaLabel = 'Loading chart.',
  testId,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      data-testid={testId}
      className={`${styles.chart} ${className}`}
    >
      <CodeSnippetSkeleton type="multi" className={styles.loading} />
    </div>
  );
};

export default ChartSkeleton;
