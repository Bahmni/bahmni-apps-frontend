import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

interface IconProps {
  name: string; // Format: "fa-home"
  className?: string;
  size?:
    | '2xs'
    | 'xs'
    | 'sm'
    | 'lg'
    | 'xl'
    | '2xl'
    | '1x'
    | '2x'
    | '3x'
    | '4x'
    | '5x'
    | '6x'
    | '7x'
    | '8x'
    | '9x'
    | '10x';
  color?: string;
  'data-testid'?: string;
}

/**
 * Icon component that renders FontAwesome icons
 *
 * Usage:
 * <Icon name="fa-home" />
 * <Icon name="fa-regular-user" />
 *
 * @param props - Component props
 * @returns React component
 */
const Icon: React.FC<IconProps> = ({
  name,
  className = '',
  size,
  color,
  'data-testid': dataTestId,
}) => {
  if (!name) return null;

  // Parse the icon name (format: "fa-home")
  const parts = name.split('-');
  if (parts.length < 2 || !parts[1]) return null;

  // Default to solid icons
  let prefix: IconPrefix = 'fas';

  // Check if it's a regular icon (fa-regular-home or far-home)
  if (parts[0] === 'far' || (parts[0] === 'fa' && parts[1] === 'regular')) {
    prefix = 'far';
    // Adjust the icon name based on format
    parts.splice(0, parts[0] === 'far' ? 1 : 2);
  } else {
    // Remove the 'fa' or 'fas' prefix
    parts.splice(0, 1);
  }

  // Join the remaining parts to form the icon name
  const iconName = parts.join('-') as IconName;

  return (
    <FontAwesomeIcon
      icon={[prefix, iconName]}
      className={className}
      size={size}
      color={color}
      data-testid={dataTestId}
    />
  );
};

export default Icon;
