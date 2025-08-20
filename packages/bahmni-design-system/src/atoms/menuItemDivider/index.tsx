import { MenuItemDivider as CarbonMenuItemDivider } from '@carbon/react';
import React from 'react';

export type MenuItemDividerProps = React.ComponentProps<
  typeof CarbonMenuItemDivider
> & {
  testId?: string;
};

export const MenuItemDivider: React.FC<MenuItemDividerProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonMenuItemDivider {...carbonProps} data-testid={testId} />;
};
