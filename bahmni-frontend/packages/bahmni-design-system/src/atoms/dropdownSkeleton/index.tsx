import {
  DropdownSkeleton as CarbonDropdownSkeleton,
} from '@carbon/react';
import React from 'react';

export type DropdownSkeletonProps = React.ComponentProps<typeof CarbonDropdownSkeleton> & {
  testId?: string;
};

export const DropdownSkeleton: React.FC<DropdownSkeletonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonDropdownSkeleton {...carbonProps} data-testid={testId} />;
};