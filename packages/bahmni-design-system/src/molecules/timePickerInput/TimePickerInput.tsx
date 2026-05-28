import React from 'react';
import { SelectItem } from '../../atoms/selectItem';
import { TimePicker } from '../../atoms/timePicker';
import { TimePickerSelect } from '../../atoms/timePickerSelect';

export interface TimePickerInputProps {
  id: string;
  testId?: string;
  labelText?: string;
  hideLabel?: boolean;
  value: string;
  meridiem: 'AM' | 'PM';
  onChange: (time: string, meridiem: 'AM' | 'PM') => void;
  invalid?: boolean;
  invalidText?: string;
}

const formatTimeInput = (input: string): string => {
  const digits = input.replaceAll(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  const hours = Number(digits.slice(0, 2)) > 12 ? '12' : digits.slice(0, 2);
  const minutes = Number(digits.slice(2)) > 59 ? '59' : digits.slice(2);
  return `${hours}:${minutes}`;
};

export const TimePickerInput: React.FC<TimePickerInputProps> = ({
  id,
  testId,
  labelText = '',
  hideLabel,
  value,
  meridiem,
  onChange,
  invalid,
  invalidText,
}) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatTimeInput(e.target.value), meridiem);
  };

  const handleMeridiemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(value, e.target.value as 'AM' | 'PM');
  };

  return (
    <TimePicker
      id={id}
      testId={testId}
      labelText={labelText}
      hideLabel={hideLabel}
      value={value}
      onChange={handleTimeChange}
      invalid={invalid}
      invalidText={invalidText}
      pattern="(1[0-2]|0?[1-9]):[0-5][0-9]"
      placeholder="hh:mm"
    >
      <TimePickerSelect
        id={`${id}-meridiem`}
        testId={testId ? `${testId}-meridiem` : `${id}-meridiem-test-id`}
        value={meridiem}
        onChange={handleMeridiemChange}
      >
        <SelectItem text="AM" value="AM" />
        <SelectItem text="PM" value="PM" />
      </TimePickerSelect>
    </TimePicker>
  );
};
