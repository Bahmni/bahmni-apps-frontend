import {
  TimePicker as CarbonTimePicker,
  TimePickerProps as CarbonTimePickerProps,
} from '@carbon/react';
import React from 'react';

export type TimePickerProps = CarbonTimePickerProps & {
  testId?: string;
};

export const TimePicker: React.FC<TimePickerProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonTimePicker {...carbonProps} data-testid={testId} />;
};
