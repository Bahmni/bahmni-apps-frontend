import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import { useEffect, useState } from 'react';

export type ComboBoxProps<T> = CarbonComboBoxProps<T> & {
  testId?: string;
  'data-testid'?: string;
  clearSelectedOnChange?: boolean;
};

export const ComboBox = <T,>({
  testId,
  'data-testid': dataTestId,
  selectedItem: externalSelectedItem,
  clearSelectedOnChange = false,
  ...carbonProps
}: ComboBoxProps<T>) => {
  const [displayItem, setDisplayItem] = useState<T | null>(
    (externalSelectedItem as T) || null,
  );

  useEffect(() => {
    setDisplayItem((externalSelectedItem as T) || null);

    if (clearSelectedOnChange && externalSelectedItem) {
      queueMicrotask(() => {
        setDisplayItem(null);
      });
    }
  }, [externalSelectedItem, clearSelectedOnChange]);

  return (
    <CarbonComboBox<T>
      {...carbonProps}
      selectedItem={displayItem}
      data-testid={testId ?? dataTestId}
    />
  );
};
