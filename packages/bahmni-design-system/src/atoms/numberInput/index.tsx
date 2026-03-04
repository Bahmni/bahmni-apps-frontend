import {
  NumberInput as CarbonNumberInput,
  NumberInputProps as CarbonNumberInputProps,
} from '@carbon/react';
import React from 'react';

export type NumberInputProps = CarbonNumberInputProps & {
  testId?: string;
  'data-testid'?: string;
};

export const NumberInput: React.FC<NumberInputProps> = ({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}) => {
  return (
    <CarbonNumberInput {...carbonProps} data-testid={testId ?? dataTestId} />
  );
};
