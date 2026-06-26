import { OverflowMenuItem as CarbonOverflowMenuItem } from '@carbon/react';
import React, { type ComponentProps } from 'react';

export type OverflowMenuItemProps = ComponentProps<
  typeof CarbonOverflowMenuItem
> & {
  testId?: string;
};

export const OverflowMenuItem: React.FC<OverflowMenuItemProps> = ({
  testId,
  ...props
}) => {
  return <CarbonOverflowMenuItem {...props} data-testid={testId} />;
};
