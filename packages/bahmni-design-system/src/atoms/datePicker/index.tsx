import {
  DatePicker as CarbonDatePicker,
  DatePickerProps as CarbonDatePickerProps,
  DatePickerInput as CarbonDatePickerInput,
  DatePickerInputProps as CarbonDatePickerInputProps,
} from '@carbon/react';
import React from 'react';

export type DatePickerProps = CarbonDatePickerProps & {
  testId?: string;
  'data-testid'?: string;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonDatePicker {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonDatePicker>
  );
};

export type DatePickerInputProps = CarbonDatePickerInputProps & {
  testId?: string;
  'data-testid'?: string;
};

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  testId,
  'data-testid': dataTestId,
  ...carbonProps
}) => {
  return (
    <CarbonDatePickerInput
      {...carbonProps}
      data-testid={testId ?? dataTestId}
    />
  );
};
