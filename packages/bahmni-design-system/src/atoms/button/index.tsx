import {
  Button as CarbonButton,
  ButtonProps as CarbonButtonProps,
} from '@carbon/react';
import React from 'react';

export type ButtonProps = CarbonButtonProps<'button'> & {
  testId?: string;
  'data-testid'?: string;
};

export const Button: React.FC<ButtonProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonButton {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonButton>
  );
};
