import React from 'react';
import {
  SkeletonText as CarbonSkeletonText,
  SkeletonTextProps as CarbonSkeletonTextProps,
} from '@carbon/react';

/**
 * SkeletonText component - A wrapper around Carbon Design System's SkeletonText
 *
 * Provides loading state placeholders for text content with optional testId support
 * for reliable automated testing. Maintains all Carbon SkeletonText functionality
 * while adding extensibility for future enhancements.
 */
export interface SkeletonTextProps extends CarbonSkeletonTextProps {
  /** Test identifier for automated testing */
  testId?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  testId,
  ...carbonProps
}) => {
  return (
    <CarbonSkeletonText {...carbonProps} data-testid={testId} />
  );
};
