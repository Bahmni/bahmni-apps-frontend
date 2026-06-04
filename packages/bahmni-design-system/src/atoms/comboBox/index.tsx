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
  onChange,
  ...carbonProps
}: ComboBoxProps<T>) => {
  const [displayItem, setDisplayItem] = useState<T | null>(
    (externalSelectedItem as T) ?? null,
  );

  useEffect(() => {
    setDisplayItem((externalSelectedItem as T) ?? null);
  }, [externalSelectedItem]);

  const handleChange = (
    event: Parameters<NonNullable<CarbonComboBoxProps<T>['onChange']>>[0],
  ) => {
    setDisplayItem((event.selectedItem as T) ?? null);
    onChange?.(event);

    if (clearSelectedOnChange && event.selectedItem) {
      queueMicrotask(() => setDisplayItem(null));
    }
  };

  return (
    <CarbonComboBox<T>
      {...carbonProps}
      onChange={handleChange}
      selectedItem={displayItem}
      data-testid={testId ?? dataTestId}
    />
  );
};
