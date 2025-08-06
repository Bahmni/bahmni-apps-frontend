import {
  TextInput as CarbonTextInput,
  TextInputProps as CarbonTextInputProps,
} from '@carbon/react';
import React from 'react';

export type TextInputProps = CarbonTextInputProps & {
  testId?: string;
};

export const TextInput: React.FC<TextInputProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonTextInput {...carbonProps} data-testid={testId} />;
};
