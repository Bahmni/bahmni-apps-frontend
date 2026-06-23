import {
  ComboButton as CarbonComboButton,
  ComboButtonProps as CarbonComboButtonProps,
} from '@carbon/react';
import React from 'react';

export type ComboButtonProps = CarbonComboButtonProps & {
  testId?: string;
  'data-testid'?: string;
};

export const ComboButton: React.FC<ComboButtonProps> = ({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}) => {
  return (
    <CarbonComboButton {...carbonProps} data-testid={testId ?? dataTestId} />
  );
};
