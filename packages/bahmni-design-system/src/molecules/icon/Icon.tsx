import { IconName } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { ICON_SIZE, ICON_PADDING } from './constants';
import styles from './styles/Icon.module.scss';

export interface IconProps {
  name: string; // Format: "fa-home"
  size?: ICON_SIZE;
  color?: string;
  id: string;
  ariaLabel?: string;
  padding?: ICON_PADDING;
  testId?: string;
}

/**
 * Icon component that renders FontAwesome icons with customizable size, color, and padding.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.name - Icon name in FontAwesome format (e.g., "fa-home", "fa-user", "fa-stethoscope")
 * @param {ICON_SIZE} [props.size] - Icon size from ICON_SIZE enum (XXS, XS, SM, LG, XL, XXL, X1-X10)
 * @param {string} [props.color] - Icon color as CSS color value
 * @param {string} props.id - Unique identifier for the icon (used for testing and accessibility)
 * @param {string} [props.ariaLabel] - Accessibility label (defaults to id if not provided)
 * @param {ICON_PADDING} [props.padding=ICON_PADDING.XXSMALL] - Padding around the icon from ICON_PADDING enum
 * @param {string} [props.testId] - Test identifier for testing purposes
 * @returns {React.ReactElement} React component
 */
const getPaddingClass = (padding: ICON_PADDING): string => {
  switch (padding) {
    case ICON_PADDING.NONE:
      return styles.paddingNone;
    case ICON_PADDING.XXSMALL:
      return styles.paddingXxsmall;
    case ICON_PADDING.XSMALL:
      return styles.paddingXsmall;
    case ICON_PADDING.SMALL:
      return styles.paddingSmall;
    case ICON_PADDING.MEDIUM:
      return styles.paddingMedium;
    case ICON_PADDING.LARGE:
      return styles.paddingLarge;
  }
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = ICON_SIZE.XS,
  color,
  id,
  ariaLabel = id,
  padding = ICON_PADDING.XXSMALL,
  testId,
}) => {
  const paddingClass = getPaddingClass(padding);

  if (!name || !/^fas?-[a-zA-Z0-9_-]+$/.test(name)) {
    return;
  }

  return (
    <span
      className={`${styles.bahmniIcon} ${paddingClass}`}
      id={id}
      data-testid={testId}
      aria-label={ariaLabel}
    >
      <FontAwesomeIcon
        icon={['fas', name as IconName]}
        size={size}
        color={color}
        data-testid={id}
      />
    </span>
  );
};

export default Icon;
