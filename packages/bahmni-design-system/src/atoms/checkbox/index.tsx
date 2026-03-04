import {
  Checkbox as CarbonCheckbox,
  CheckboxProps as CarbonCheckboxProps,
} from '@carbon/react';
import React from 'react';

export type CheckboxProps = CarbonCheckboxProps & {
  testId?: string;
  'data-testid'?: string;
};

export const Checkbox: React.FC<CheckboxProps> = ({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}) => {
  return <CarbonCheckbox {...carbonProps} data-testid={testId ?? dataTestId} />;
};
