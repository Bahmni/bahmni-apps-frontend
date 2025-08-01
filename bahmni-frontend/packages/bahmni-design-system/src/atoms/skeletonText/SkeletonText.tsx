import React from 'react';
import {
  SkeletonText as CarbonSkeletonText,
  SkeletonTextProps as CarbonSkeletonTextProps,
} from '@carbon/react';

export type SkeletonTextProps = CarbonSkeletonTextProps & {
  testId?: string;
};

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonSkeletonText {...carbonProps} data-testid={testId} />;
};
