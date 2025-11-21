import type { AddressHierarchyEntry } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AddressLevel } from '../../../../hooks/useAddressFields';
import { AddressAutocompleteField } from '../AddressAutocompleteField';

// Mock the translation hook
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      // Simulate translation: ADDRESS_FIELD_STATEPROVINCE -> State
      const translations: Record<string, string> = {
        ADDRESS_FIELD_STATEPROVINCE: 'State',
        ADDRESS_FIELD_POSTALCODE: 'Postal Code',
        ADDRESS_FIELD_COUNTYDISTRICT: 'District',
        ADDRESS_FIELD_CITYVILLAGE: 'City/Village',
        ADDRESS_FIELD_ADDRESS1: 'Address Line 1',
        ADDRESS_FIELD_ADDRESS2: 'Address Line 2',
      };
      return translations[key] ?? key;
    },
  })),
}));

// Mock the ComboBox component
jest.mock('@bahmni/design-system', () => ({
  ComboBox: jest.fn(
    ({
      id,
      titleText,
      placeholder,
      items,
      selectedItem,
      disabled,
      invalid,
      invalidText,
      allowCustomValue,
      onChange,
      onInputChange,
      itemToString,
      itemToElement,
    }) => {
      const handleSelection = (item: any) => {
        onChange({ selectedItem: item });
      };

      const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(e.target.value);
      };

      const handleClear = () => {
        onChange({ selectedItem: null });
      };

      return (
        <div data-testid={`combobox-${id}`}>
          <label htmlFor={id}>{titleText}</label>
          <input
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={invalid}
            data-custom-value={allowCustomValue}
            onChange={handleInput}
            value={selectedItem ? itemToString(selectedItem) : ''}
            data-testid={`input-${id}`}
          />
          {invalid && <div data-testid="error-message">{invalidText}</div>}
          <button
            data-testid={`clear-${id}`}
            onClick={handleClear}
            aria-label="Clear"
          >
            Clear
          </button>
          <ul data-testid={`suggestions-${id}`}>
            {items.map((item: any, index: number) => (
              <li
                key={item.uuid ?? item.name ?? index}
                data-testid={`suggestion-${index}`}
                onClick={() => handleSelection(item)}
              >
                {itemToElement(item)}
              </li>
            ))}
          </ul>
        </div>
      );
    },
  ),
}));

describe('AddressAutocompleteField', () => {
  const mockLevel: AddressLevel = {
    addressField: 'stateProvince',
    name: 'State',
    required: true,
    isStrictEntry: true,
  };

  const mockSuggestions: AddressHierarchyEntry[] = [
    {
      name: 'Karnataka',
      uuid: 'state-uuid-1',
      userGeneratedId: null,
      parent: {
        name: 'India',
        uuid: 'country-uuid-1',
        userGeneratedId: null,
      },
    },
    {
      name: 'Tamil Nadu',
      uuid: 'state-uuid-2',
      userGeneratedId: null,
      parent: {
        name: 'India',
        uuid: 'country-uuid-1',
        userGeneratedId: null,
      },
    },
  ];

  const mockOnSelectionChange = jest.fn();
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required field indicator', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByLabelText('State *')).toBeInTheDocument();
    });

    it('should render without required indicator for non-required fields', () => {
      const nonRequiredLevel = { ...mockLevel, required: false };

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={nonRequiredLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByLabelText('State')).toBeInTheDocument();
      expect(screen.queryByLabelText('State *')).not.toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByPlaceholderText('State')).toBeInTheDocument();
    });

    it('should render disabled when isDisabled is true', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId('input-stateProvince');
      expect(input).toBeDisabled();
    });

    it('should show error message when error prop is provided', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          error="This field is required"
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      const input = screen.getByTestId('input-stateProvince');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Suggestions Display', () => {
    it('should display suggestions list', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={mockSuggestions}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const suggestionsList = screen.getByTestId('suggestions-stateProvince');
      expect(suggestionsList.children).toHaveLength(2);
    });

    it('should display suggestions with parent name in format "value, parent"', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={mockSuggestions}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByText('Karnataka, India')).toBeInTheDocument();
      expect(screen.getByText('Tamil Nadu, India')).toBeInTheDocument();
    });

    it('should display userGeneratedId instead of name if available', () => {
      const postalCodeSuggestions: AddressHierarchyEntry[] = [
        {
          name: 'Postal Code Name',
          uuid: 'postal-uuid-1',
          userGeneratedId: '560001',
          parent: {
            name: 'Bangalore',
            uuid: 'city-uuid-1',
            userGeneratedId: null,
          },
        },
      ];

      render(
        <AddressAutocompleteField
          fieldName="postalCode"
          level={{
            ...mockLevel,
            addressField: 'postalCode',
            name: 'Postal Code',
          }}
          isDisabled={false}
          suggestions={postalCodeSuggestions}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByText('560001, Bangalore')).toBeInTheDocument();
    });

    it('should display value without parent when parent is not available', () => {
      const suggestionsWithoutParent: AddressHierarchyEntry[] = [
        {
          name: 'Karnataka',
          uuid: 'state-uuid-1',
          userGeneratedId: null,
          parent: undefined,
        },
      ];

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={suggestionsWithoutParent}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByText('Karnataka')).toBeInTheDocument();
      expect(screen.queryByText(/, /)).not.toBeInTheDocument();
    });
  });

  describe('Selection Handling', () => {
    it('should call onSelectionChange when item is selected', async () => {
      const user = userEvent.setup();

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={mockSuggestions}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const firstSuggestion = screen.getByTestId('suggestion-0');
      await user.click(firstSuggestion);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(
        'stateProvince',
        mockSuggestions[0],
      );
    });

    it('should display selected item value in input', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={mockSuggestions}
          selectedItem={mockSuggestions[0]}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId(
        'input-stateProvince',
      ) as HTMLInputElement;
      expect(input.value).toBe('Karnataka');
    });

    it('should display userGeneratedId in input if available', () => {
      const selectedItem: AddressHierarchyEntry = {
        name: 'Postal Name',
        uuid: 'postal-uuid-1',
        userGeneratedId: '560001',
        parent: undefined,
      };

      render(
        <AddressAutocompleteField
          fieldName="postalCode"
          level={{ ...mockLevel, addressField: 'postalCode' }}
          isDisabled={false}
          suggestions={[]}
          selectedItem={selectedItem}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId('input-postalCode') as HTMLInputElement;
      expect(input.value).toBe('560001');
    });

    it('should call onSelectionChange with null when selection is cleared', async () => {
      const user = userEvent.setup();

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={mockSuggestions}
          selectedItem={mockSuggestions[0]}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const clearButton = screen.getByTestId('clear-stateProvince');
      await user.click(clearButton);

      expect(mockOnSelectionChange).toHaveBeenCalledWith('stateProvince', null);
    });
  });

  describe('Input Handling', () => {
    it('should call onInputChange when user types', async () => {
      const user = userEvent.setup();

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId('input-stateProvince');
      await user.type(input, 'Ka');

      // userEvent.type() types each character individually
      expect(mockOnInputChange).toHaveBeenCalledTimes(2);
      expect(mockOnInputChange).toHaveBeenNthCalledWith(
        1,
        'stateProvince',
        'K',
      );
      expect(mockOnInputChange).toHaveBeenNthCalledWith(
        2,
        'stateProvince',
        'a',
      );
    });
  });

  describe('Custom Value Handling', () => {
    it('should allow custom values when isStrictEntry is false', () => {
      const nonStrictLevel: AddressLevel = {
        ...mockLevel,
        isStrictEntry: false,
      };

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={nonStrictLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId('input-stateProvince');
      expect(input).toHaveAttribute('data-custom-value', 'true');
    });

    it('should not allow custom values when isStrictEntry is true', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId('input-stateProvince');
      expect(input).toHaveAttribute('data-custom-value', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty suggestions array', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={[]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const suggestionsList = screen.getByTestId('suggestions-stateProvince');
      expect(suggestionsList.children).toHaveLength(0);
    });

    it('should handle null selectedItem', () => {
      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={mockSuggestions}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      const input = screen.getByTestId(
        'input-stateProvince',
      ) as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle item without parent', () => {
      const itemWithoutParent: AddressHierarchyEntry = {
        name: 'Test',
        uuid: 'test-uuid',
        userGeneratedId: null,
        parent: undefined,
      };

      render(
        <AddressAutocompleteField
          fieldName="stateProvince"
          level={mockLevel}
          isDisabled={false}
          suggestions={[itemWithoutParent]}
          selectedItem={null}
          onSelectionChange={mockOnSelectionChange}
          onInputChange={mockOnInputChange}
        />,
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
