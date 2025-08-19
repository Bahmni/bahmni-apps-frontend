import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';

export type ComboBoxProps<T> = CarbonComboBoxProps<T> & {
  testId?: string;
};

export const ComboBox = <T,>({ testId, ...carbonProps }: ComboBoxProps<T>) => {
  return <CarbonComboBox<T> {...carbonProps} data-testid={testId} />;
};
