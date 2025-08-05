import {
  DatePicker as CarbonDatePicker,
  DatePickerProps as CarbonDatePickerProps,
  DatePickerInput as CarbonDatePickerInput,
  DatePickerInputProps as CarbonDatePickerInputProps,
} from '@carbon/react';
import React from 'react';

export type DatePickerProps = CarbonDatePickerProps & {
  testId?: string;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonDatePicker {...carbonProps} data-testid={testId}>
      {children}
    </CarbonDatePicker>
  );
};

export type DatePickerInputProps = CarbonDatePickerInputProps & {
  testId?: string;
};

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonDatePickerInput {...carbonProps} data-testid={testId} />;
};
