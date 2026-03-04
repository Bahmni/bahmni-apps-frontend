import {
  MenuButton as CarbonMenuButton,
  MenuButtonProps as CarbonMenuButtonProps,
} from '@carbon/react';
import React from 'react';

export type MenuButtonProps = CarbonMenuButtonProps & {
  testId?: string;
};

export const MenuButton: React.FC<MenuButtonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonMenuButton {...carbonProps} data-testid={testId} />;
};
