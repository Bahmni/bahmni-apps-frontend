import {
  TimePicker as CarbonTimePicker,
  TimePickerProps as CarbonTimePickerProps,
} from '@carbon/react';
import React, { useState, useCallback } from 'react';
import {
  TIME_PICKER_24H_PATTERN,
  TIME_PICKER_PLACEHOLDER_24H,
} from './constants';

export type TimePickerProps = CarbonTimePickerProps & {
  testId?: string;
  pattern?: string;
  use24HourFormat?: boolean;
};

export const TimePicker: React.FC<TimePickerProps> = ({
  testId,
  onChange,
  onBlur,
  value,
  pattern,
  use24HourFormat = true,
  placeholder,
  ...carbonProps
}) => {
  // Use provided pattern or default based on format
  const validationPattern =
    pattern ?? (use24HourFormat ? TIME_PICKER_24H_PATTERN : undefined);
  const placeholderText = placeholder ?? TIME_PICKER_PLACEHOLDER_24H;
  const [internalValue, setInternalValue] = useState(value ?? '');

  const formatTimeInput = (input: string): string => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');

    // Limit to 4 digits
    const limitedDigits = digitsOnly.slice(0, 4);

    // Format as HH:MM
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else {
      return `${limitedDigits.slice(0, 2)}:${limitedDigits.slice(2)}`;
    }
  };

  const validateAndCorrectTime = (input: string): string => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');

    // If empty or less than 3 digits, return as is
    if (digitsOnly.length < 3) {
      return input;
    }

    // Limit to 4 digits
    const limitedDigits = digitsOnly.slice(0, 4);

    let hours = limitedDigits.slice(0, 2);
    let minutes = limitedDigits.slice(2);

    // Validate and auto-correct hours (1-12 for 12-hour format)
    let hoursNum = parseInt(hours, 10);
    if (hoursNum > 12) {
      hoursNum = 12;
      hours = '12';
    } else if (hoursNum === 0) {
      hoursNum = 1;
      hours = '01';
    } else if (hoursNum < 10 && hours.length === 1) {
      hours = '0' + hours;
    }

    // Validate and auto-correct minutes (0-59)
    if (minutes.length > 0) {
      let minutesNum = parseInt(minutes, 10);
      if (minutesNum > 59) {
        minutesNum = 59;
        minutes = '59';
      } else if (minutesNum < 10 && minutes.length === 1) {
        minutes = '0' + minutes;
      }
    }

    return `${hours}:${minutes}`;
  };

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;

      // Allow empty value (for backspace to work properly)
      if (rawValue === '') {
        setInternalValue('');
        if (onChange) {
          onChange(event);
        }
        return;
      }

      const formattedValue = formatTimeInput(rawValue);

      // Update internal state
      setInternalValue(formattedValue);

      // Create a new event with the formatted value
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: formattedValue,
        },
      };

      // Call the original onChange if provided
      if (onChange) {
        onChange(syntheticEvent);
      }
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const char = event.key;
      const currentValue = (event.target as HTMLInputElement).value;

      // Allow control keys (backspace, delete, tab, escape, enter, arrows, etc.)
      if (
        event.key === 'Backspace' ||
        event.key === 'Delete' ||
        event.key === 'Tab' ||
        event.key === 'Escape' ||
        event.key === 'Enter' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'Home' ||
        event.key === 'End' ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return; // Allow these keys to work normally
      }

      // Only allow digits for new input
      if (!/^\d$/.test(char)) {
        event.preventDefault();
        return;
      }

      // Check if we're at the 4-digit limit (excluding the colon)
      const digitsCount = currentValue.replace(/\D/g, '').length;
      if (digitsCount >= 4) {
        event.preventDefault();
        return;
      }

      // Additional validation for minutes position
      const digitsOnly = currentValue.replace(/\D/g, '');
      const newDigit = parseInt(char, 10);

      // If we're typing the first digit of minutes (position after colon)
      if (digitsOnly.length === 2 && newDigit > 5) {
        event.preventDefault();
        return;
      }

      // If we're typing the second digit of minutes
      if (digitsOnly.length === 3) {
        const firstMinuteDigit = parseInt(digitsOnly[2], 10);
        if (firstMinuteDigit === 5 && newDigit > 9) {
          event.preventDefault();
          return;
        }
        if (firstMinuteDigit > 5) {
          event.preventDefault();
          return;
        }
      }
    },
    [],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const currentValue = event.target.value;

      // Only validate and correct if there's a value
      if (currentValue.trim() !== '') {
        const correctedValue = validateAndCorrectTime(currentValue);

        // Update internal state if the value changed
        if (correctedValue !== currentValue) {
          setInternalValue(correctedValue);

          // Create a new event with the corrected value for onChange
          const syntheticChangeEvent = {
            ...event,
            target: {
              ...event.target,
              value: correctedValue,
            },
          } as React.ChangeEvent<HTMLInputElement>;

          // Call the original onChange if provided
          if (onChange) {
            onChange(syntheticChangeEvent);
          }
        }
      }

      // Call the original onBlur if provided
      if (onBlur) {
        onBlur(event);
      }
    },
    [onChange, onBlur],
  );

  return (
    <CarbonTimePicker
      {...carbonProps}
      data-testid={testId}
      value={internalValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholderText}
      pattern={validationPattern}
      maxLength={5} // HH:MM format
    />
  );
};
