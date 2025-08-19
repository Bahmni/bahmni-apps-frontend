import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import React from 'react';

export type ComboBoxProps<T = unknown> = CarbonComboBoxProps<T> & {
  testId?: string;
};

export const ComboBox = <T = unknown>({
  testId,
  ...carbonProps
}: ComboBoxProps<T>) => {
  return <CarbonComboBox<T> {...carbonProps} data-testid={testId} />;
};
