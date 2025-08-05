import {
  Dropdown as CarbonDropdown,
  DropdownProps as CarbonDropdownProps,
} from '@carbon/react';
import React from 'react';

export type DropdownProps = CarbonDropdownProps<unknown> & {
  testId?: string;
};

export const Dropdown: React.FC<DropdownProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonDropdown {...carbonProps} data-testid={testId} />;
};
