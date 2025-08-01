import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import React from 'react';

export type ComboBoxProps = CarbonComboBoxProps<any> & {
  testId?: string;
};

export const ComboBox: React.FC<ComboBoxProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonComboBox {...carbonProps} data-testid={testId} />;
};
