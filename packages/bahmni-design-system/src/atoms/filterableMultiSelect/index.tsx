import {
  FilterableMultiSelect as CarbonFilterableMultiSelect,
  FilterableMultiSelectProps as CarbonFilterableMultiSelectProps,
} from '@carbon/react';
import React from 'react';

export type FilterableMultiSelectProps =
  CarbonFilterableMultiSelectProps<unknown> & {
    testId?: string;
  };

export const FilterableMultiSelect: React.FC<FilterableMultiSelectProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonFilterableMultiSelect {...carbonProps} data-testid={testId} />;
};
