import {
  TextArea as CarbonTextArea,
  TextAreaProps as CarbonTextAreaProps,
} from '@carbon/react';
import React from 'react';

export type TextAreaProps = CarbonTextAreaProps & {
  testId?: string;
};

export const TextArea: React.FC<TextAreaProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonTextArea {...carbonProps} data-testid={testId} />;
};
