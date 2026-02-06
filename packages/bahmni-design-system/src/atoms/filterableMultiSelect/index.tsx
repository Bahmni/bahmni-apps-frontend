import {
  FilterableMultiSelect as CarbonFilterableMultiSelect,
  FilterableMultiSelectProps as CarbonFilterableMultiSelectProps,
} from '@carbon/react';
import React from 'react';

export type FilterableMultiSelectProps =
  CarbonFilterableMultiSelectProps<unknown> & {
    testId?: string;
    'data-testid'?: string;
  };

export const FilterableMultiSelect: React.FC<FilterableMultiSelectProps> = ({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}) => {
  return (
    <CarbonFilterableMultiSelect
      {...carbonProps}
      data-testid={testId ?? dataTestId}
    />
  );
};
