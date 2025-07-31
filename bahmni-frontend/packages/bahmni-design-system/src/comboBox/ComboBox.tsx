import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import React from 'react';

export type ComboBoxProps<ItemType> = CarbonComboBoxProps<ItemType> & {
  testId?: string;
};

export const ComboBox = <ItemType,>({
  testId,
  ...carbonProps
}: ComboBoxProps<ItemType>) => {
  return <CarbonComboBox {...carbonProps} data-testid={testId} />;
};
