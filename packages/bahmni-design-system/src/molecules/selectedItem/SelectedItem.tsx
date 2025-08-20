import { Close } from '@carbon/icons-react';
import { Button, Column, Grid } from '@carbon/react';
import classNames from 'classnames';
import React, { ReactNode } from 'react';
import styles from './styles/SelectedItem.module.scss';

/**
 * SelectedItem is a common component that displays content with a close button.
 * It's typically used for displaying selected items in a list or form context
 * where users can dismiss/remove the selection.
 */
export interface SelectedItemProps {
  /**
   * The content to display within the selected item container
   */
  children: ReactNode;

  /**
   * Function called when the close button is clicked
   */
  onClose: () => void;

  /**
   * Optional additional CSS class name to apply to the component
   */
  className?: string;

  /**
   * Optional data test id for testing
   */
  dataTestId?: string;
}

/**
 * A component for displaying selected items with a close button
 */
export const SelectedItem: React.FC<SelectedItemProps> = ({
  children,
  onClose,
  className,
  dataTestId = 'selected-item',
}) => {
  return (
    <Grid
      narrow
      fullWidth
      className={classNames(styles.grid, className)}
      data-testid={dataTestId}
    >
      <Column sm={3} md={7} lg={15} xlg={15} className={styles.children}>
        {children}
      </Column>
      <Column sm={1} md={1} lg={1} xlg={1} className={styles.close}>
        <Button
          id="close-selected-item"
          size="lg"
          hasIconOnly
          renderIcon={Close}
          iconDescription="Selected Item Close"
          aria-label="Close Selected Item"
          onClick={onClose}
          data-testid={`${dataTestId}-close-button`}
        />
      </Column>
    </Grid>
  );
};
export default SelectedItem;
