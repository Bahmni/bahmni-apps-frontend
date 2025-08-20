import { Toggletip, ToggletipButton, ToggletipContent } from '@carbon/react';
import React from 'react';
import { Icon, ICON_SIZE, ICON_PADDING } from '../icon';
import styles from './styles/TooltipIcon.module.scss';

export interface TooltipIconProps {
  /**
   * Icon name in the format "fa-home", "fa-file-lines", etc.
   */
  iconName: string;

  /**
   * The content to display in the tooltip
   */
  content: React.ReactNode;

  /**
   * Icon size from ICON_SIZE enum
   * @default ICON_SIZE.LG
   */
  iconSize?: ICON_SIZE;

  /**
   * Icon padding from ICON_PADDING enum
   * @default ICON_PADDING.NONE
   */
  iconPadding?: ICON_PADDING;

  /**
   * Whether the tooltip should auto-align
   * @default true
   */
  autoAlign?: boolean;

  /**
   * Additional CSS class name for custom styling
   */
  className?: string;

  /**
   * Test identifier for testing purposes
   */
  testId?: string;

  /**
   * Accessibility label for the icon
   */
  ariaLabel?: string;
}

/**
 * TooltipIcon component that combines an icon with a toggletip for displaying additional information.
 *
 * @component
 * @example
 * ```tsx
 * <TooltipIcon
 *   iconName="fa-file-lines"
 *   content="This is additional information"
 *   testId="info-tooltip"
 * />
 * ```
 */
export const TooltipIcon: React.FC<TooltipIconProps> = ({
  iconName,
  content,
  iconSize = ICON_SIZE.LG,
  iconPadding = ICON_PADDING.NONE,
  autoAlign = true,
  className,
  testId,
  ariaLabel,
}) => {
  // Don't render if content is empty or falsy
  if (!content) {
    return null;
  }

  const iconId = testId ? `${testId}-icon` : `tooltip-icon-${iconName}`;
  const combinedClassName = `${styles.tooltipIcon} ${className ?? ''}`.trim();

  return (
    <Toggletip
      autoAlign={autoAlign}
      className={combinedClassName}
      data-testid={testId}
    >
      <ToggletipButton>
        <Icon
          id={iconId}
          name={iconName}
          size={iconSize}
          padding={iconPadding}
          ariaLabel={ariaLabel}
        />
      </ToggletipButton>
      <ToggletipContent>{content}</ToggletipContent>
    </Toggletip>
  );
};

export default TooltipIcon;
