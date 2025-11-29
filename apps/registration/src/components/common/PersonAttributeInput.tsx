import {
  Checkbox,
  CheckboxGroup,
  DatePicker,
  DatePickerInput,
  Dropdown,
  TextInput,
} from '@bahmni/design-system';
import {
  AttributeInputType,
  getInputTypeForFormat,
  useTranslation,
  MAX_PHONE_NUMBER_LENGTH,
} from '@bahmni/services';
import { ChangeEvent } from 'react';
import { AttributeAnswer } from '../../hooks/usePersonAttributeFields';
import styles from '../common/styles/index.module.scss';

export interface ValidationConfig {
  pattern?: string;
  errorMessage?: string;
}

export interface PersonAttributeInputProps {
  uuid: string;
  label: string;
  format: string;
  value: string | number | boolean | undefined;
  answers?: AttributeAnswer[];
  error?: string;
  placeholder?: string;
  validation?: ValidationConfig;
  onChange: (value: string | number | boolean) => void;
}

/**
 * Dynamic person attribute input component that renders appropriate input
 * based on the attribute format (Boolean, Concept, String, Date, Number, etc.)
 */
export const PersonAttributeInput = ({
  uuid,
  label,
  format,
  value,
  answers,
  error,
  placeholder,
  validation,
  onChange,
}: PersonAttributeInputProps) => {
  const { t } = useTranslation();
  const inputType = getInputTypeForFormat(format);

  switch (inputType) {
    case AttributeInputType.TEXT:
      return (
        <TextInput
          id={uuid}
          type="text"
          labelText={label}
          placeholder={placeholder ?? label}
          value={typeof value === 'string' ? value : ''}
          invalid={!!error}
          invalidText={error}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          pattern={validation?.pattern}
        />
      );

    case AttributeInputType.CHECKBOX:
      return (
        <CheckboxGroup legendText={label}>
          <div className={styles.checkboxField}>
            <Checkbox
              id={uuid}
              checked={value === true || value === 'true'}
              onChange={(evt, { checked }) => onChange(checked)}
              labelText={''}
            />
          </div>
        </CheckboxGroup>
      );

    case AttributeInputType.DROPDOWN: {
      const items =
        answers?.map((answer) => ({
          id: answer.uuid,
          label: answer.display,
        })) ?? [];

      const selectedItem = items.find(
        (item) => item.id === (typeof value === 'string' ? value : ''),
      );

      return (
        <Dropdown
          id={uuid}
          titleText={label}
          label={placeholder ?? `Select ${label}`}
          items={items}
          selectedItem={selectedItem}
          itemToString={(item) => (item ? item.label : '')}
          invalid={!!error}
          invalidText={error}
          onChange={({ selectedItem: selected }) => {
            onChange(selected?.id ?? '');
          }}
        />
      );
    }

    case AttributeInputType.DATE:
      return (
        <DatePicker
          datePickerType="single"
          onChange={(dates: Date[]) => {
            if (dates && dates.length > 0) {
              onChange(dates[0].toISOString().split('T')[0]);
            }
          }}
        >
          <DatePickerInput
            id={uuid}
            labelText={label}
            placeholder={placeholder ?? 'mm/dd/yyyy'}
            invalid={!!error}
            invalidText={error}
          />
        </DatePicker>
      );

    case AttributeInputType.NUMBER: {
      const numericValue =
        typeof value === 'number'
          ? value.toString()
          : typeof value === 'string'
            ? value
            : '';

      const handleNumberKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
      ) => {
        if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
          e.preventDefault();
        }
      };

      const handleNumberPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const sanitized = pastedText.replace(/[-+eE.]/g, '');

        if (sanitized && /^\d+$/.test(sanitized)) {
          onChange(sanitized);
        }
      };

      const hasMaxLengthError = numericValue.length > MAX_PHONE_NUMBER_LENGTH;
      const maxLengthError = hasMaxLengthError
        ? t('REGISTRATION_INVALID_NUMBER_MAX_LENGTH')
        : '';

      const displayError = maxLengthError || error;

      return (
        <TextInput
          id={uuid}
          type="number"
          labelText={label}
          placeholder={placeholder ?? label}
          min={0}
          value={numericValue}
          invalid={!!displayError}
          invalidText={displayError}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
          }}
          onKeyDown={handleNumberKeyDown}
          onPaste={handleNumberPaste}
        />
      );
    }

    default:
      return (
        <TextInput
          id={uuid}
          type="text"
          labelText={label}
          placeholder={placeholder ?? label}
          value={typeof value === 'string' ? value : ''}
          invalid={!!error}
          invalidText={error}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          pattern={validation?.pattern}
        />
      );
  }
};

PersonAttributeInput.displayName = 'PersonAttributeInput';

export default PersonAttributeInput;
