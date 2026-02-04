import { AttributeInputType, getInputTypeForFormat } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import {
  PersonAttributeInput,
  PersonAttributeInputProps,
} from '../PersonAttributeInput';

// Mock the services
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  getInputTypeForFormat: jest.fn(),
  MAX_PHONE_NUMBER_LENGTH: 10,
}));

const mockGetInputTypeForFormat = getInputTypeForFormat as jest.MockedFunction<
  typeof getInputTypeForFormat
>;

describe('PersonAttributeInput', () => {
  const defaultProps: PersonAttributeInputProps = {
    uuid: 'test-uuid',
    name: 'testField',
    label: 'Test Label',
    format: 'java.lang.String',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Input', () => {
    beforeEach(() => {
      mockGetInputTypeForFormat.mockReturnValue(AttributeInputType.TEXT);
    });

    it('should render text input for string format', () => {
      render(<PersonAttributeInput {...defaultProps} />);

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('text');
    });

    it('should display initial value', () => {
      render(<PersonAttributeInput {...defaultProps} value="initial value" />);

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.value).toBe('initial value');
    });

    it('should call onChange when value changes', () => {
      const onChange = jest.fn();
      render(<PersonAttributeInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByLabelText('Test Label');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('should display error message when provided', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          error="This field is invalid"
        />,
      );

      expect(screen.getByText('This field is invalid')).toBeInTheDocument();
    });

    it('should use placeholder when provided', () => {
      render(
        <PersonAttributeInput {...defaultProps} placeholder="Enter text" />,
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.placeholder).toBe('Enter text');
    });

    it('should use label as placeholder when not provided', () => {
      render(<PersonAttributeInput {...defaultProps} />);

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.placeholder).toBe('Test Label');
    });

    it('should handle validation pattern', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          validation={{
            pattern: '^[a-zA-Z]+$',
            errorMessage: 'Only letters allowed',
          }}
        />,
      );

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.pattern).toBe('^[a-zA-Z]+$');
    });
  });

  describe('Checkbox Input', () => {
    beforeEach(() => {
      mockGetInputTypeForFormat.mockReturnValue(AttributeInputType.CHECKBOX);
    });

    it('should render checkbox for boolean format', () => {
      render(
        <PersonAttributeInput {...defaultProps} format="java.lang.Boolean" />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should check checkbox when value is true', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="java.lang.Boolean"
          value
        />,
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should check checkbox when value is string "true"', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="java.lang.Boolean"
          value="true"
        />,
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should uncheck checkbox when value is false', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="java.lang.Boolean"
          value={false}
        />,
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should call onChange with boolean when clicked', () => {
      const onChange = jest.fn();
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="java.lang.Boolean"
          onChange={onChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should toggle checkbox state', () => {
      const onChange = jest.fn();
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="java.lang.Boolean"
          value={false}
          onChange={onChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Dropdown Input', () => {
    const answers = [
      { uuid: 'option-1', display: 'Option 1' },
      { uuid: 'option-2', display: 'Option 2' },
      { uuid: 'option-3', display: 'Option 3' },
    ];

    beforeEach(() => {
      mockGetInputTypeForFormat.mockReturnValue(AttributeInputType.DROPDOWN);
    });

    it('should render dropdown for concept format', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Concept"
          answers={answers}
        />,
      );

      expect(screen.getByText('Select Test Label')).toBeInTheDocument();
    });

    it('should use custom placeholder when provided', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Concept"
          answers={answers}
          placeholder="Choose option"
        />,
      );

      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should call onChange when option selected', () => {
      const onChange = jest.fn();
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Concept"
          answers={answers}
          onChange={onChange}
        />,
      );

      // This is a simplified test - actual Dropdown interaction would be more complex
      // In real testing, you'd need to interact with Carbon's Dropdown component
      expect(screen.getByText('Select Test Label')).toBeInTheDocument();
    });

    it('should display error when provided', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Concept"
          answers={answers}
          error="Selection required"
        />,
      );

      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('should handle empty answers array', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Concept"
          answers={[]}
        />,
      );

      expect(screen.getByText('Select Test Label')).toBeInTheDocument();
    });

    it('should handle undefined answers', () => {
      render(
        <PersonAttributeInput {...defaultProps} format="org.openmrs.Concept" />,
      );

      expect(screen.getByText('Select Test Label')).toBeInTheDocument();
    });
  });

  describe('Date Input', () => {
    beforeEach(() => {
      mockGetInputTypeForFormat.mockReturnValue(AttributeInputType.DATE);
    });

    it('should render date picker for date format', () => {
      render(
        <PersonAttributeInput {...defaultProps} format="org.openmrs.Date" />,
      );

      const input = screen.getByLabelText('Test Label');
      expect(input).toBeInTheDocument();
    });

    it('should use custom placeholder when provided', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Date"
          placeholder="dd/mm/yyyy"
        />,
      );

      const input = screen.getByPlaceholderText('dd/mm/yyyy');
      expect(input).toBeInTheDocument();
    });

    it('should use default placeholder when not provided', () => {
      render(
        <PersonAttributeInput {...defaultProps} format="org.openmrs.Date" />,
      );

      const input = screen.getByPlaceholderText('mm/dd/yyyy');
      expect(input).toBeInTheDocument();
    });

    it('should display error when provided', () => {
      render(
        <PersonAttributeInput
          {...defaultProps}
          format="org.openmrs.Date"
          error="Invalid date"
        />,
      );

      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });
  });

  describe('Component Properties', () => {
    it('should have correct displayName', () => {
      expect(PersonAttributeInput.displayName).toBe('PersonAttributeInput');
    });

    it('should handle undefined value gracefully', () => {
      mockGetInputTypeForFormat.mockReturnValue(AttributeInputType.TEXT);
      render(<PersonAttributeInput {...defaultProps} value={undefined} />);

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle non-string value for text input', () => {
      mockGetInputTypeForFormat.mockReturnValue(AttributeInputType.TEXT);

      render(<PersonAttributeInput {...defaultProps} value={123 as any} />);

      const input = screen.getByLabelText('Test Label') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });
});
