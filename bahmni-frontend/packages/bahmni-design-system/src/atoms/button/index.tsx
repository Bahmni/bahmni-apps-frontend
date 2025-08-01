import {
  Button as CarbonButton,
  ButtonProps as CarbonButtonProps,
  ButtonSet as CarbonButtonSet,
} from '@carbon/react';
import { ButtonSetProps as CarbonButtonSetProps } from '@carbon/react/lib/components/ButtonSet/ButtonSet';
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

export type ButtonSetProps = CarbonButtonSetProps & {
  testId?: string;
};

export const ButtonSet: React.FC<ButtonSetProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonButtonSet {...carbonProps} data-testid={testId}>
      {children}
    </CarbonButtonSet>
  );
};
