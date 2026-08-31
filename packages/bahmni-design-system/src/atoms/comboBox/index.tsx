import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
} from '@carbon/react';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';

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
    setDisplayItem((currentDisplayItem) => {
      const next = (externalSelectedItem as T) ?? null;
      return isEqual(currentDisplayItem, next) ? currentDisplayItem : next;
    });
  }, [externalSelectedItem]);

  const handleChange = (
    event: Parameters<NonNullable<CarbonComboBoxProps<T>['onChange']>>[0],
  ) => {
    if (externalSelectedItem === undefined) {
      setDisplayItem((event.selectedItem as T) ?? null);
    }
    onChange?.(event);

    if (clearSelectedOnChange && event.selectedItem != null) {
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
