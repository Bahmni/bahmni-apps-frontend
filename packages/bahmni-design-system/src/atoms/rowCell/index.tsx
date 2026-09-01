import classNames from 'classnames';
import React from 'react';
import styles from './styles/index.module.scss';

export interface RowCellProps {
  header: React.ReactNode;
  value: React.ReactNode;
  info?: React.ReactNode;
  id?: string;
  testId?: string;
  ariaLabel?: string;
  className?: string;
}

export const RowCell: React.FC<RowCellProps> = ({
  header,
  value,
  info,
  id = 'row-cell',
  testId = 'row-cell-test-id',
  ariaLabel = 'row-cell-aria-label',
  className,
}) => {
  return (
    <div
      className={classNames(styles.rowCell, className)}
      id={id}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      <div
        className={styles.header}
        id={`${id}-header`}
        data-testid={`${testId}-header`}
        aria-label={`${ariaLabel}-header`}
      >
        {header}
      </div>
      <div
        className={styles.value}
        id={`${id}-value`}
        data-testid={`${testId}-value`}
        aria-label={`${ariaLabel}-value`}
      >
        {value}
      </div>
      {info && (
        <div
          className={styles.info}
          id={`${id}-info`}
          data-testid={`${testId}-info`}
          aria-label={`${ariaLabel}-info`}
        >
          {info}
        </div>
      )}
    </div>
  );
};

export default RowCell;
