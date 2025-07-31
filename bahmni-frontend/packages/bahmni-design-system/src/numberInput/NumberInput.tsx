import {
  NumberInput as CarbonNumberInput,
  NumberInputProps as CarbonNumberInputProps,
} from '@carbon/react';
import React from 'react';

export type NumberInputProps = CarbonNumberInputProps & {
  testId?: string;
};

export const NumberInput: React.FC<NumberInputProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonNumberInput {...carbonProps} data-testid={testId} />;
};
