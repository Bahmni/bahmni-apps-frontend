import type { ReactNode } from 'react';
import styles from '../styles/DataTable.module.scss';

interface DataTableErrorProps {
  message: ReactNode;
  dataTestId: string;
}

export const DataTableError = ({
  message,
  dataTestId,
}: DataTableErrorProps) => (
  <p data-testid={`${dataTestId}-error`} className={styles.statePlaceholder}>
    {message}
  </p>
);
