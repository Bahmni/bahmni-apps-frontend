import React from 'react';
import { DotMark } from '@carbon/icons-react';
import { Tag } from '@carbon/react';

export interface StatusTagProps {
  /**
   * The text label to display in the status tag
   */
  label: string;

  /**
   * CSS class name for styling the dot icon
   */
  dotClassName: string;

  /**
   * Test identifier for testing purposes
   */
  testId: string;
}

/**
 * StatusTag component that displays a status label with an optional colored dot icon.
 *
 * @component
 * @example
 * ```tsx
 * <StatusTag
 *   label="Active"
 *   dotClassName="active-status"
 *   testId="status-tag"
 * />
 * ```
 */
export const StatusTag: React.FC<StatusTagProps> = ({
  label,
  dotClassName,
  testId,
}) => {
  return (
    <Tag
      type="outline"
      data-testid={testId}
      renderIcon={() => <DotMark className={dotClassName} />}
    >
      {label}
    </Tag>
  );
};

export default StatusTag;
