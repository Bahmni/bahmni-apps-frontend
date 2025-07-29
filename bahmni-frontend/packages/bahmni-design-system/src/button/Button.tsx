import React from 'react';
import {
  Button as CarbonButton,
  ButtonProps as CarbonButtonProps,
} from '@carbon/react';

export type ButtonProps = CarbonButtonProps<'button'> & {
  testId?: string;
};

export const Button: React.FC<ButtonProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonButton {...carbonProps} data-testid={testId}>
      {children}
    </CarbonButton>
  );
};
