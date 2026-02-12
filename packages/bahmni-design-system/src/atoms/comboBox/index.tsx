import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
  OnChangeData,
} from '@carbon/react';
import { useRef } from 'react';

export type ComboBoxProps<T> = CarbonComboBoxProps<T> & {
  testId?: string;
  'data-testid'?: string;
};

export const ComboBox = <T,>({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}: ComboBoxProps<T>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downshiftActions = useRef<any>(null);

  const handleOnChange = (selectedItem: OnChangeData<T>) => {
    if (carbonProps.onChange && selectedItem) {
      carbonProps.onChange(selectedItem);
      downshiftActions.current?.setInputValue('');
    }
  };

  return (
    <CarbonComboBox<T>
      {...carbonProps}
      data-testid={testId ?? dataTestId}
      onChange={handleOnChange}
      downshiftActions={downshiftActions}
    />
  );
};
