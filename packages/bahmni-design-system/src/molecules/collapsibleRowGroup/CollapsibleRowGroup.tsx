import classNames from 'classnames';
import React from 'react';
import { Accordion, AccordionItem } from '../../atoms/accordion';
import { RowCell } from '../../atoms/rowCell';
import styles from './styles/CollapsibleRowGroup.module.scss';

export interface RowData {
  index: number;
  header: string;
  value: React.ReactNode;
  info?: string;
}

export interface CollapsibleRowGroupProps {
  title: string;
  rows: RowData[];
  className?: string;
  id?: string;
}

export const CollapsibleRowGroup: React.FC<CollapsibleRowGroupProps> = ({
  title,
  rows,
  className,
  id = 'collapsible-row-group',
}) => {
  return (
    <div
      className={classNames(styles.container, className)}
      id={id}
      data-testid={`${id}-test-id`}
      aria-label={`${id}-aria-label`}
    >
      <Accordion>
        <AccordionItem
          title={title}
          open
          testId={`${id}-test-id-accordion-item`}
        >
          <div className={styles.rowsContainer}>
            {rows.map((row) => (
              <RowCell
                key={`${id}-row-${row.index}`}
                header={row.header}
                value={row.value}
                info={row.info}
                id={`${id}-row-${row.index}`}
                testId={`${id}-test-id-row-${row.index}`}
                ariaLabel={`${id}-row-${row.index}-aria-label`}
              />
            ))}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default CollapsibleRowGroup;
