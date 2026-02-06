import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';

export type ComboBoxProps<T> = CarbonComboBoxProps<T> & {
  testId?: string;
  'data-testid'?: string;
};

export const ComboBox = <T,>({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}: ComboBoxProps<T>) => {
  return (
    <CarbonComboBox<T> {...carbonProps} data-testid={testId ?? dataTestId} />
  );
};
