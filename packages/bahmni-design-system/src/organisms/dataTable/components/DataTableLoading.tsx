import { DataTableSkeleton } from '@carbon/react';
import classnames from 'classnames';
import styles from '../styles/DataTable.module.scss';

interface DataTableLoadingProps {
  columnCount: number;
  rowCount?: number;
  className?: string;
  dataTestId: string;
}

export const DataTableLoading = ({
  columnCount,
  rowCount = 5,
  className,
  dataTestId,
}: DataTableLoadingProps) => (
  <div data-testid={`${dataTestId}-skeleton`} className={className}>
    <DataTableSkeleton
      columnCount={columnCount}
      rowCount={rowCount}
      showHeader={false}
      showToolbar={false}
      compact
      className={classnames(styles.skeleton)}
    />
  </div>
);
