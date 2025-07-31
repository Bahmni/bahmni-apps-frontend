import {
  Button as CarbonButton,
  ButtonProps as CarbonButtonProps,
  ButtonSet,
} from '@carbon/react';
import React from 'react';

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

// ButtonSet wrapper
export type ButtonSetWrapperProps = React.ComponentProps<typeof ButtonSet> & {
  testId?: string;
  children?: React.ReactNode;
};

export const ButtonSetWrapper: React.FC<ButtonSetWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <ButtonSet {...carbonProps} data-testid={testId}>
      {children}
    </ButtonSet>
  );
};
