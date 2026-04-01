import {
  DatePicker as CarbonDatePicker,
  DatePickerProps as CarbonDatePickerProps,
  DatePickerInput as CarbonDatePickerInput,
  DatePickerInputProps as CarbonDatePickerInputProps,
} from '@carbon/react';
import React, { useMemo } from 'react';
import { getDateFormats } from './dateFormatUtils';

export type DatePickerProps = CarbonDatePickerProps & {
  testId?: string;
  'data-testid'?: string;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  testId,
  'data-testid': dataTestId,
  dateFormat,
  children,
  ...carbonProps
}) => {
  const formats = useMemo(() => getDateFormats(), []);

  const finalDateFormat = dateFormat ?? formats.flatpickrFormat;

  return (
    <CarbonDatePicker
      {...carbonProps}
      dateFormat={finalDateFormat}
      data-testid={testId ?? dataTestId}
    >
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
  placeholder,
  ...carbonProps
}) => {
  const formats = useMemo(() => getDateFormats(), []);

  //TODO translations will be taken care later for placeholder
  const finalPlaceholder = placeholder ?? formats.dateFnsFormat;

  return (
    <CarbonDatePickerInput
      {...carbonProps}
      placeholder={finalPlaceholder}
      data-testid={testId ?? dataTestId}
    />
  );
};
