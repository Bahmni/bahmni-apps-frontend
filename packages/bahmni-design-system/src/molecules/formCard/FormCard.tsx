import React from 'react';
import classNames from 'classnames';
import { Icon } from '../icon';
import { ICON_SIZE, ICON_PADDING } from '../icon';
import styles from './styles/FormCard.module.scss';

/**
 * FormCard component props following SOLID principles
 */
export interface FormCardProps {
  // Core content - Single Responsibility
  title: string;
  description?: string;
  children?: React.ReactNode;
  
  // Icon configuration - Interface Segregation
  icon: string; // FontAwesome icon name
  iconSize?: ICON_SIZE;
  
  // Action configuration - Interface Segregation
  actionIcon?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  
  // Behavior configuration - Open/Closed principle (extensible)
  onCardClick?: () => void;
  onOpen?: () => void;
  onEdit?: () => void;
  
  // State configuration - Single Responsibility
  disabled?: boolean;
  selected?: boolean;
  
  // Styling and accessibility - Interface Segregation
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
}

/**
 * Action Icon Props - Single Responsibility Principle
 * Handles only action icon rendering and interaction
 */
interface ActionIconProps {
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * ActionIcon Component - Single Responsibility
 * Responsible only for rendering and handling action icon interactions
 */
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
      onClick(e as any);
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

/**
 * Card Header Props - Single Responsibility
 */
interface CardHeaderProps {
  title: string;
  icon: string;
  iconSize: ICON_SIZE;
  actionIcon?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

/**
 * CardHeader Component - Single Responsibility
 * Responsible only for rendering the card header with title, icon, and optional action
 */
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

/**
 * Card Content Props - Single Responsibility
 */
interface CardContentProps {
  description?: string;
  children?: React.ReactNode;
}

/**
 * CardContent Component - Single Responsibility
 * Responsible only for rendering the card content area
 */
const CardContent: React.FC<CardContentProps> = ({ description, children }) => {
  if (!description && !children) {
    return null;
  }

  return (
    <div className={styles.content}>
      {description && <div className={styles.description}>{description}</div>}
      {children}
    </div>
  );
};

/**
 * Click Handler Hook - Single Responsibility
 * Handles the logic for determining which click handler to use
 */
const useClickHandler = (
  onCardClick?: () => void,
  onOpen?: () => void,
  onEdit?: () => void,
  disabled?: boolean
) => {
  // Dependency Inversion: Depends on abstractions (function types) not concrete implementations
  const primaryClickHandler = onCardClick || onOpen || onEdit;

  const handleCardClick = () => {
    if (!disabled && primaryClickHandler) {
      primaryClickHandler();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && primaryClickHandler) {
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

/**
 * FormCard Component - Open/Closed Principle
 * Open for extension through composition and props, closed for modification
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Each component has one clear purpose
 * - Open/Closed: Extensible through props and composition, not modification
 * - Liskov Substitution: Can be used anywhere a clickable card is expected
 * - Interface Segregation: Props are grouped by concern
 * - Dependency Inversion: Depends on abstractions (function props) not concrete implementations
 */
export const FormCard: React.FC<FormCardProps> = ({
  title,
  description,
  children,
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
}) => {
  const { handleCardClick, handleKeyDown, hasClickHandler } = useClickHandler(
    onCardClick,
    onOpen,
    onEdit,
    disabled
  );

  const cardClasses = classNames(
    styles.formCard,
    {
      [styles.disabled]: disabled,
      [styles.selected]: selected,
      [styles.clickable]: hasClickHandler,
    },
    className
  );

  const accessibilityProps = {
    'data-testid': dataTestId,
    'aria-label': ariaLabel || title,
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
      <CardContent description={description}>
        {children}
      </CardContent>
    </div>
  );
};

export default FormCard;