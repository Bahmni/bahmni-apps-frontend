import { Maximize, Minimize } from '@carbon/icons-react';
import { Button, ButtonSet } from '@carbon/react';
import classNames from 'classnames';
import React, { ReactNode, useEffect, useId, useRef } from 'react';
import { IconButton } from '../../atoms/iconButton';
import styles from './styles/ActionArea.module.scss';

const TOGGLE_ICON_SIZE = 16;

/**
 * ActionArea component props
 */
export interface ActionAreaProps {
  title: ReactNode; // Title of the ActionArea
  primaryButtonText: string; // Text for the primary button
  onPrimaryButtonClick: () => void; // Function to be called when primary button is clicked
  isPrimaryButtonDisabled?: boolean; // Whether the primary button should be disabled
  secondaryButtonText?: string; // Text for the secondary button
  onSecondaryButtonClick?: () => void; // Function to be called when secondary button is clicked
  isSecondaryButtonDisabled?: boolean; // Whether the secondary button should be disabled
  tertiaryButtonText?: string; // Text for the tertiary button
  onTertiaryButtonClick?: () => void; // Function to be called when tertiary button is clicked
  isTertiaryButtonDisabled?: boolean; // Whether the tertiary button should be disabled
  content: ReactNode; // Content to be rendered inside the ActionArea
  className?: string; // Optional CSS class
  ariaLabel?: string; // Accessible label for the component
  buttonGroupAriaLabel?: string; // Aria label for the button group
  hidden?: boolean;
  isExpanded?: boolean; // Whether the ActionArea is expanded to full width
  onToggleExpand?: () => void; // Function to be called when the expand/collapse toggle is clicked
  expandAriaLabel?: string; // Accessible label for the expand toggle button
  collapseAriaLabel?: string; // Accessible label for the collapse toggle button
  headerActions?: ReactNode; // Extra controls rendered alongside the expand/collapse toggle
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
  isExpanded = false,
  onToggleExpand,
  expandAriaLabel = 'Expand',
  collapseAriaLabel = 'Collapse',
  headerActions,
}) => {
  const buttonCount =
    1 + // primary button (always present)
    Number(!!(secondaryButtonText && onSecondaryButtonClick)) +
    Number(!!(tertiaryButtonText && onTertiaryButtonClick));

  const buttonCountClass = {
    3: styles.threeButtons,
    2: styles.twoButtons,
    1: styles.singleButton,
  }[buttonCount];

  // Determine accessible label for the component
  const accessibleLabel = ariaLabel ?? 'Action Area';
  const hasHeaderActions = Boolean(headerActions) || Boolean(onToggleExpand);
  const titleId = useId();

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const hasMountedRef = useRef(false);

  // Toggling expand/collapse hides the main-display panel from keyboard/AT
  // users (see ActionAreaLayout's `inert` on that panel); refocus the
  // toggle so focus isn't silently dropped when it was inside that panel.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    toggleButtonRef.current?.focus();
  }, [isExpanded]);

  return (
    <div
      className={classNames(styles.actionArea, className, {
        [styles.hidden]: hidden,
        [styles.noBorder]: isExpanded,
      })}
      role="region"
      aria-label={accessibleLabel}
      aria-hidden={hidden}
    >
      <div
        className={classNames(styles.header, isExpanded && styles.cappedWidth)}
      >
        <h2 className={styles.title} id={titleId}>
          {title}
        </h2>
        {hasHeaderActions && (
          <div className={styles.headerActions}>
            {headerActions}
            {onToggleExpand && (
              <IconButton
                ref={toggleButtonRef}
                kind="ghost"
                size="sm"
                label={isExpanded ? collapseAriaLabel : expandAriaLabel}
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
                testId="action-area-expand-toggle"
              >
                {isExpanded ? (
                  <Minimize size={TOGGLE_ICON_SIZE} />
                ) : (
                  <Maximize size={TOGGLE_ICON_SIZE} />
                )}
              </IconButton>
            )}
          </div>
        )}
      </div>
      <section className={styles.content} aria-labelledby={titleId}>
        <div className={classNames(isExpanded && styles.cappedWidth)}>
          {content}
        </div>
      </section>

      <ButtonSet
        className={classNames(
          styles.buttonSet,
          isExpanded && styles.cappedWidth,
        )}
        aria-label={buttonGroupAriaLabel}
      >
        {secondaryButtonText && onSecondaryButtonClick && (
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
        )}

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
