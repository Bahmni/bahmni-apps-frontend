import {
  MenuItem as CarbonMenuItem,
  MenuItemProps as CarbonMenuItemProps,
} from '@carbon/react';
import React from 'react';

export type MenuItemProps = CarbonMenuItemProps & {
  testId?: string;
};

export const MenuItem: React.FC<MenuItemProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonMenuItem {...carbonProps} data-testid={testId} />;
};
