import React, { ReactNode } from 'react';
import { Button, ButtonSet } from '@carbon/react';
import * as styles from './styles/ActionArea.module.scss';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

/**
 * ActionArea component props
 */
export interface ActionAreaProps {
  title: string; // Title of the ActionArea
  primaryButtonText: string; // Text for the primary button
  onPrimaryButtonClick: () => void; // Function to be called when primary button is clicked
  secondaryButtonText: string; // Text for the secondary button
  onSecondaryButtonClick: () => void; // Function to be called when secondary button is clicked
  tertiaryButtonText?: string; // Text for the tertiary button
  onTertiaryButtonClick?: () => void; // Function to be called when tertiary button is clicked
  content: ReactNode; // Content to be rendered inside the ActionArea
  className?: string; // Optional CSS class
  ariaLabel?: string; // Accessible label for the component
}

/**
 * ActionArea component provides a rectangular container with 2-3 action buttons
 * at the bottom and space for content passed in as children.
 *
 * It slides in from the right side of the screen and can be closed by setting
 * the isVisible prop to false.
 */
const ActionArea: React.FC<ActionAreaProps> = ({
  title,
  primaryButtonText,
  onPrimaryButtonClick,
  secondaryButtonText,
  onSecondaryButtonClick,
  tertiaryButtonText,
  onTertiaryButtonClick,
  content,
  className,
  ariaLabel,
}) => {
  const { t } = useTranslation();

  const buttonCountClass =
    tertiaryButtonText && onTertiaryButtonClick
      ? styles.threeButtons
      : styles.twoButtons;

  // Determine accessible label for the component
  const accessibleLabel = ariaLabel || 'Action Area';

  return (
    <div
      className={classNames(styles.actionArea, className)}
      role="region"
      aria-label={accessibleLabel}
    >
      <h2 className={styles.title} id="action-area-title">
        {t(title)}
      </h2>
      <div
        className={styles.content}
        role="region"
        aria-labelledby="action-area-title"
      >
        {content}
      </div>

      <ButtonSet
        className={styles.buttonSet}
        aria-label={t('ACTION_AREA.BUTTON_GROUP')}
      >
        <Button
          kind="secondary"
          onClick={onSecondaryButtonClick}
          className={buttonCountClass}
          aria-label={t(secondaryButtonText)}
        >
          {t(secondaryButtonText)}
        </Button>

        {tertiaryButtonText && onTertiaryButtonClick && (
          <Button
            kind="tertiary"
            onClick={onTertiaryButtonClick}
            className={buttonCountClass}
            aria-label={t(tertiaryButtonText)}
          >
            {t(tertiaryButtonText)}
          </Button>
        )}

        <Button
          kind="primary"
          onClick={onPrimaryButtonClick}
          className={buttonCountClass}
          aria-label={t(primaryButtonText)}
        >
          {t(primaryButtonText)}
        </Button>
      </ButtonSet>
    </div>
  );
};

export default ActionArea;
