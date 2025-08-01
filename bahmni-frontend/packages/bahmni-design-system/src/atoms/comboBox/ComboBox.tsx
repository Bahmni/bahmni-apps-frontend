import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import React from 'react';

export interface ComboBoxProps extends CarbonComboBoxProps {
  testId?: string;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonComboBox {...carbonProps} data-testid={testId} />;
};
