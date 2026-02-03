import {
  TextInput as CarbonTextInput,
  TextInputProps as CarbonTextInputProps,
} from '@carbon/react';
import React from 'react';

export type TextInputProps = CarbonTextInputProps & {
  testId?: string;
  'data-testid'?: string;
};

export const TextInput: React.FC<TextInputProps> = ({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}) => {
  return (
    <CarbonTextInput {...carbonProps} data-testid={testId ?? dataTestId} />
  );
};
