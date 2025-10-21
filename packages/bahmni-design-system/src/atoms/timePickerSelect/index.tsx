import {
  TimePickerSelect as CarbonTimePickerSelect,
  TimePickerSelectProps as CarbonTimePickerSelectProps,
} from '@carbon/react';
import React from 'react';

export type TimePickerSelectProps = CarbonTimePickerSelectProps & {
  testId?: string;
};

export const TimePickerSelect: React.FC<TimePickerSelectProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonTimePickerSelect {...carbonProps} data-testid={testId} />;
};
