import {
  SkeletonPlaceholder as CarbonSkeletonPlaceholder,
  SkeletonPlaceholderProps as CarbonSkeletonPlaceholderProps,
} from '@carbon/react';
import React from 'react';

export type SkeletonPlaceholderProps = CarbonSkeletonPlaceholderProps & {
  testId?: string;
};

export const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonSkeletonPlaceholder {...carbonProps} data-testid={testId} />;
};
