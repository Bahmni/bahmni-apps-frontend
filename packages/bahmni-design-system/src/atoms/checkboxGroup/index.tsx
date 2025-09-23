import {
  CheckboxGroup as CarbonCheckboxGroup,
  CheckboxGroupProps as CarbonCheckboxGroupProps,
} from '@carbon/react';
import React from 'react';

export type CheckboxGroupProps = CarbonCheckboxGroupProps & {
  testId?: string;
};

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonCheckboxGroup {...carbonProps} data-testid={testId} />;
};
