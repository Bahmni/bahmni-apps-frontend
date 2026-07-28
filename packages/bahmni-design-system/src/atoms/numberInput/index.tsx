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
  disableWheel = true,
  ...carbonProps
}) => {
  return (
    <CarbonNumberInput
      {...carbonProps}
      disableWheel={disableWheel}
      data-testid={testId ?? dataTestId}
    />
  );
};
