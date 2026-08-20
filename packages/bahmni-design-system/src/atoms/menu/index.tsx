import {
  Menu as CarbonMenu,
  MenuProps as CarbonMenuProps,
} from '@carbon/react';
import React from 'react';

export type MenuProps = CarbonMenuProps & {
  testId?: string;
};

export const Menu: React.FC<MenuProps> = ({ testId, ...carbonProps }) => {
  return <CarbonMenu {...carbonProps} data-testid={testId} />;
};
