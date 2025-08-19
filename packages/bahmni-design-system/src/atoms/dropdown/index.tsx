import {
  Dropdown as CarbonDropdown,
  DropdownProps as CarbonDropdownProps,
} from '@carbon/react';

export type DropdownProps<T> = CarbonDropdownProps<T> & {
  testId?: string;
};

export const Dropdown = <T,>({ testId, ...carbonProps }: DropdownProps<T>) => {
  return <CarbonDropdown {...carbonProps} data-testid={testId} />;
};
