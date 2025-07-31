import { FormGroup as CarbonFormGroup } from '@carbon/react';
import React from 'react';

export type FormGroupProps = React.ComponentProps<typeof CarbonFormGroup> & {
  testId?: string;
  children?: React.ReactNode;
};

export const FormGroup: React.FC<FormGroupProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonFormGroup {...carbonProps} data-testid={testId}>
      {children}
    </CarbonFormGroup>
  );
};
