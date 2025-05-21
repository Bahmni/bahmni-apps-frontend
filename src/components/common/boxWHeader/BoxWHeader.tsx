import React, { ReactNode } from 'react';
import { Column, Grid } from '@carbon/react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/BoxWHeader.module.scss';

/**
 * BoxWHeader Props
 * @interface BoxWHeaderProps
 */
export interface BoxWHeaderProps {
  /**
   * The title to display in the header.
   * If the title is a translation key, it will be automatically translated.
   */
  title: string;

  /**
   * The content to display in the box body
   */
  children: ReactNode;

  /**
   * Optional CSS class name to apply to the container
   */
  className?: string;

  /**
   * Optional data-testid attribute for testing
   * @default 'box-w-title'
   */
  dataTestId?: string;
  /**
   * Optional ARIA label for the section
   * If not provided, the title will be used
   */
  ariaLabel?: string;
}

/**
 * BoxWHeader component
 *
 * A container with a header title and content area.
 * Uses Carbon Design Grid for responsive layout.
 */
const BoxWHeader: React.FC<BoxWHeaderProps> = ({
  title,
  children,
  className,
  dataTestId = 'box-w-title',
  ariaLabel,
}) => {
  const { t } = useTranslation();

  // Translate title if it's a translation key
  const translatedTitle = t(title);

  return (
    <Grid
      narrow
      fullWidth
      className={classNames(styles.box, className)}
      data-testid={dataTestId}
      aria-label={ariaLabel || translatedTitle}
      role="region"
    >
      <Column sm={4} md={8} lg={16} xlg={16} className={styles.header}>
        {translatedTitle}
      </Column>
      <Column sm={4} md={8} lg={16} xlg={16}>
        {children}
      </Column>
    </Grid>
  );
};

export default BoxWHeader;
