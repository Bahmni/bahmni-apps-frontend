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
  name: string;
  label: string;
  format: string;
  value: string | number | boolean | undefined;
  answers?: AttributeAnswer[];
  error?: string;
  placeholder?: string;
  validation?: ValidationConfig;
  onChange: (value: string | number | boolean) => void;
}

const isNumericValue = (value: string): boolean => {
  const numericRegex = /^[0-9]*$/;
  return numericRegex.test(value);
};

/**
 * Dynamic person attribute input component that renders appropriate input
 * based on the attribute format (Boolean, Concept, String, Date, Number, etc.)
 */
export const PersonAttributeInput = ({
  uuid,
  name,
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
          data-testid={`person-attribute-text-input-${name}`}
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
        <CheckboxGroup
          legendText={label}
          data-testid={`person-attribute-checkbox-group-${name}`}
        >
          <div className={styles.checkboxField}>
            <Checkbox
              id={uuid}
              data-testid={`person-attribute-checkbox-${name}`}
              checked={value === true || value === 'true'}
              onChange={(_, { checked }) => onChange(checked)}
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
          data-testid={`person-attribute-dropdown-${name}`}
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
          data-testid={`person-attribute-date-picker-${name}`}
          onChange={(dates: Date[]) => {
            if (dates && dates.length > 0) {
              onChange(dates[0].toISOString().split('T')[0]);
            }
          }}
        >
          <DatePickerInput
            id={uuid}
            data-testid={`person-attribute-date-input-${name}`}
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

      const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (isNumericValue(newValue)) {
          onChange(newValue);
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
          data-testid={`person-attribute-number-input-${name}`}
          type="text"
          labelText={label}
          placeholder={placeholder ?? label}
          value={numericValue}
          invalid={!!displayError}
          invalidText={displayError}
          onChange={handleNumberChange}
          pattern={validation?.pattern}
        />
      );
    }

    default:
      return (
        <TextInput
          id={uuid}
          data-testid={`person-attribute-default-input-${name}`}
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
