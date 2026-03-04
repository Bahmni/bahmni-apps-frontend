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
  id?: string;
  className?: string;
  title: string;
  rows?: RowData[];
  children?: React.ReactNode;
  open?: boolean;
}

export const CollapsibleRowGroup: React.FC<CollapsibleRowGroupProps> = ({
  title,
  rows,
  children,
  className,
  id = 'collapsible-row-group',
  open = false,
}) => {
  return (
    <div
      className={classNames(styles.container, className)}
      id={id}
      data-testid={`${id}-test-id`}
      aria-label={`${id}-aria-label`}
    >
      <Accordion align="start" size="lg">
        <AccordionItem
          title={title}
          open={open}
          testId={`${id}-test-id-accordion-item`}
          className={styles.accordion}
        >
          <div
            id={`${id}-rows`}
            data-testid={`${id}-rows-test-id`}
            aria-label={`${id}-rows-aria-label`}
            className={styles.rows}
          >
            {rows?.map((row) => (
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
            {children}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default CollapsibleRowGroup;
