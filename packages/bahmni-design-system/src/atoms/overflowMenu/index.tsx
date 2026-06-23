import {
  OverflowMenu as CarbonOverflowMenu,
  type OverflowMenuProps as CarbonOverflowMenuProps,
} from '@carbon/react';
import React from 'react';

export type OverflowMenuProps = CarbonOverflowMenuProps & {
  testId?: string;
};

export const OverflowMenu: React.FC<OverflowMenuProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonOverflowMenu {...carbonProps} data-testid={testId} />;
};
