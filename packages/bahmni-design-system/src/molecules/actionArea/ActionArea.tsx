import { Button, ButtonSet } from '@carbon/react';
import classNames from 'classnames';
import React, { ReactNode } from 'react';
import styles from './styles/ActionArea.module.scss';

/**
 * ActionArea component props
 */
export interface ActionAreaProps {
  title: string; // Title of the ActionArea
  primaryButtonText: string; // Text for the primary button
  onPrimaryButtonClick: () => void; // Function to be called when primary button is clicked
  isPrimaryButtonDisabled?: boolean; // Whether the primary button should be disabled
  secondaryButtonText: string; // Text for the secondary button
  onSecondaryButtonClick: () => void; // Function to be called when secondary button is clicked
  isSecondaryButtonDisabled?: boolean; // Whether the secondary button should be disabled
  tertiaryButtonText?: string; // Text for the tertiary button
  onTertiaryButtonClick?: () => void; // Function to be called when tertiary button is clicked
  isTertiaryButtonDisabled?: boolean; // Whether the tertiary button should be disabled
  content: ReactNode; // Content to be rendered inside the ActionArea
  className?: string; // Optional CSS class
  ariaLabel?: string; // Accessible label for the component
  buttonGroupAriaLabel?: string; // Aria label for the button group
  hidden?: boolean;
}

/**
 * ActionArea component provides a rectangular container with 2-3 action buttons
 * at the bottom and space for content passed in as children.
 *
 * All text content including title and button labels should be passed as props
 * to allow for external translation management.
 */
export const ActionArea: React.FC<ActionAreaProps> = ({
  title,
  primaryButtonText,
  onPrimaryButtonClick,
  isPrimaryButtonDisabled = false,
  secondaryButtonText,
  onSecondaryButtonClick,
  isSecondaryButtonDisabled = false,
  tertiaryButtonText,
  onTertiaryButtonClick,
  isTertiaryButtonDisabled = false,
  content,
  className,
  ariaLabel,
  buttonGroupAriaLabel = 'Action buttons',
  hidden = false,
}) => {
  const buttonCountClass =
    tertiaryButtonText && onTertiaryButtonClick
      ? styles.threeButtons
      : styles.twoButtons;

  // Determine accessible label for the component
  const accessibleLabel = ariaLabel ?? 'Action Area';

  return (
    <div
      className={classNames(styles.actionArea, className, {
        [styles.hidden]: hidden,
      })}
      role="region"
      aria-label={accessibleLabel}
      aria-hidden={hidden}
    >
      <h2 className={styles.title} id="action-area-title">
        {title}
      </h2>
      <div
        className={styles.content}
        role="region"
        aria-labelledby="action-area-title"
      >
        {content}
      </div>

      <ButtonSet className={styles.buttonSet} aria-label={buttonGroupAriaLabel}>
        <Button
          kind="secondary"
          onClick={onSecondaryButtonClick}
          disabled={isSecondaryButtonDisabled}
          className={buttonCountClass}
          aria-label={secondaryButtonText}
          data-testid="action-area-secondary-button"
        >
          {secondaryButtonText}
        </Button>

        {tertiaryButtonText && onTertiaryButtonClick && (
          <Button
            kind="tertiary"
            onClick={onTertiaryButtonClick}
            disabled={isTertiaryButtonDisabled}
            className={buttonCountClass}
            aria-label={tertiaryButtonText}
            data-testid="action-area-tertiary-button"
          >
            {tertiaryButtonText}
          </Button>
        )}

        <Button
          kind="primary"
          onClick={onPrimaryButtonClick}
          disabled={isPrimaryButtonDisabled}
          className={buttonCountClass}
          aria-label={primaryButtonText}
          data-testid="action-area-primary-button"
        >
          {primaryButtonText}
        </Button>
      </ButtonSet>
    </div>
  );
};

export default ActionArea;
