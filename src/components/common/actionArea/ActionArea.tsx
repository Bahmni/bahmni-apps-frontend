import React, { ReactNode } from 'react';
import { Button, ButtonSet, MenuItemDivider } from '@carbon/react';
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
  children: ReactNode; // Content to be rendered inside the ActionArea
  className?: string; // Optional CSS class
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
  children,
  className,
}) => {
  const { t } = useTranslation();

  const buttonCountClass =
    tertiaryButtonText && onTertiaryButtonClick
      ? styles.threeButtons
      : styles.twoButtons;

  return (
    <div className={classNames(styles.actionArea, className)}>
      <h2 className={styles.title}>{t(title)}</h2>
      <MenuItemDivider />
      <div className={styles.content}>{children}</div>

      <ButtonSet className={styles.buttonSet}>
        <Button
          kind="secondary"
          onClick={onSecondaryButtonClick}
          className={buttonCountClass}
        >
          {t(secondaryButtonText)}
        </Button>

        {tertiaryButtonText && onTertiaryButtonClick && (
          <Button
            kind="tertiary"
            onClick={onTertiaryButtonClick}
            className={buttonCountClass}
          >
            {t(tertiaryButtonText)}
          </Button>
        )}

        <Button
          kind="primary"
          onClick={onPrimaryButtonClick}
          className={buttonCountClass}
        >
          {t(primaryButtonText)}
        </Button>
      </ButtonSet>
    </div>
  );
};

export default ActionArea;
