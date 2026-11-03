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
  if (digits.length < 2) return digits;
  const rawHours = Number(digits.slice(0, 2));
  // A two-digit hour above 12 can only be a single-digit hour followed by minutes (e.g. "9:0")
  if (rawHours > 12) {
    const minutes = Number(digits.slice(1, 3)) > 59 ? '59' : digits.slice(1, 3);
    return `${digits[0]}:${minutes}`;
  }
  if (digits.length === 2) return digits;
  const hours = rawHours < 1 ? '01' : digits.slice(0, 2);
  const minutes = Number(digits.slice(2)) > 59 ? '59' : digits.slice(2);
  return `${hours}:${minutes}`;
};

// Completes a partially typed time on blur: "9" -> "09:00", "9:3" -> "09:03"
const completeTimeInput = (input: string): string => {
  if (!input) return input;
  const [rawHours, rawMinutes = ''] = input.split(':');
  const hours = String(Math.min(Math.max(Number(rawHours), 1), 12)).padStart(
    2,
    '0',
  );
  return `${hours}:${rawMinutes.padStart(2, '0')}`;
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

  const handleBlur = () => {
    const completed = completeTimeInput(value);
    if (completed !== value) onChange(completed, meridiem);
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
      onBlur={handleBlur}
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
