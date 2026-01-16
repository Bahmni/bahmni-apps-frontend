import classNames from 'classnames';
import React from 'react';
import { Icon, ICON_SIZE, ICON_PADDING } from '../icon';
import styles from './styles/FormCard.module.scss';

export interface FormCardProps {
  title: string;
  icon: string;
  iconSize?: ICON_SIZE;
  actionIcon?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  onCardClick?: () => void;
  onOpen?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
  errorMessage?: string;
}

interface ActionIconProps {
  icon: string;
  onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const ActionIcon: React.FC<ActionIconProps> = ({
  icon,
  onClick,
  disabled = false,
  ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onClick(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={classNames(styles.actionIcon, {
        [styles.disabled]: disabled,
      })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <Icon
        id={`action-icon-${icon}`}
        name={icon}
        size={ICON_SIZE.SM}
        padding={ICON_PADDING.NONE}
      />
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  icon: string;
  iconSize: ICON_SIZE;
  actionIcon?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  icon,
  iconSize,
  actionIcon,
  onActionClick,
  disabled,
}) => {
  return (
    <div className={styles.header}>
      <Icon
        id={`card-icon-${icon}`}
        name={icon}
        size={iconSize}
        padding={ICON_PADDING.NONE}
      />
      <div className={styles.title}>{title}</div>
      {actionIcon && onActionClick && (
        <ActionIcon
          icon={actionIcon}
          onClick={onActionClick}
          disabled={disabled}
          ariaLabel={`Action for ${title}`}
        />
      )}
    </div>
  );
};

const useClickHandler = (
  onCardClick?: () => void,
  onOpen?: () => void,
  onEdit?: () => void,
  disabled?: boolean,
) => {
  const primaryClickHandler = onCardClick ?? onOpen ?? onEdit;

  const handleCardClick = () => {
    if (!disabled && primaryClickHandler) {
      primaryClickHandler();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && primaryClickHandler) {
      e.preventDefault();
      primaryClickHandler();
    }
  };

  return {
    handleCardClick,
    handleKeyDown,
    hasClickHandler: !!primaryClickHandler,
  };
};

export const FormCard: React.FC<FormCardProps> = ({
  title,
  icon,
  iconSize = ICON_SIZE.LG,
  actionIcon,
  onActionClick,
  onCardClick,
  onOpen,
  onEdit,
  disabled = false,
  selected = false,
  className,
  dataTestId = 'form-card',
  ariaLabel,
  errorMessage,
}) => {
  const { handleCardClick, handleKeyDown, hasClickHandler } = useClickHandler(
    onCardClick,
    onOpen,
    onEdit,
    disabled,
  );

  const cardClasses = classNames(
    styles.formCard,
    {
      [styles.disabled]: disabled,
      [styles.selected]: selected,
      [styles.clickable]: hasClickHandler,
      [styles.error]: errorMessage,
    },
    className,
  );

  const accessibilityProps = {
    'data-testid': dataTestId,
    'aria-label': ariaLabel ?? title,
    'aria-disabled': disabled,
    ...(hasClickHandler && {
      role: 'button',
      tabIndex: disabled ? -1 : 0,
    }),
  };

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      {...accessibilityProps}
    >
      <CardHeader
        title={title}
        icon={icon}
        iconSize={iconSize}
        actionIcon={actionIcon}
        onActionClick={onActionClick}
        disabled={disabled}
      />
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
    </div>
  );
};

export default FormCard;
