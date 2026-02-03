import {
  Dropdown as CarbonDropdown,
  DropdownProps as CarbonDropdownProps,
} from '@carbon/react';

export type DropdownProps<T> = CarbonDropdownProps<T> & {
  testId?: string;
  'data-testid'?: string;
};

export const Dropdown = <T,>({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}: DropdownProps<T>) => {
  return <CarbonDropdown {...carbonProps} data-testid={testId ?? dataTestId} />;
};
