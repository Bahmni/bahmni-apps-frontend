import {
  SelectItem as CarbonSelectItem,
  SelectItemProps as CarbonSelectItemProps,
} from '@carbon/react';
import React from 'react';

export type SelectItemProps = CarbonSelectItemProps & {
  testId?: string;
};

export const SelectItem: React.FC<SelectItemProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonSelectItem {...carbonProps} data-testid={testId} />;
};
